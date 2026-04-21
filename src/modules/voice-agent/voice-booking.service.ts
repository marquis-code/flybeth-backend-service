import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FlightsIntegrationService } from "../integrations/flights-integration.service";
import { BookingsService } from "../bookings/bookings.service";
import axios from "axios";
import { Types } from "mongoose";

@Injectable()
export class VoiceBookingService {
  private readonly logger = new Logger(VoiceBookingService.name);
  private sessions: Map<
    string,
    {
      messages: { role: string; content: string }[];
      latestResults?: any[];
      userId?: string | null;
    }
  > = new Map();

  constructor(
    private configService: ConfigService,
    private flightsService: FlightsIntegrationService,
    private bookingsService: BookingsService,
  ) {}

  /**
   * Initialize a session with the welcome greeting context
   */
  initSession(clientId: string, userId: string | null = null) {
    this.sessions.set(clientId, {
      userId,
      messages: [
        {
          role: "system",
          content: `You are Flybeth, a premium AI travel assistant for Flybeth Travels.
Your goal is to guide the user through a frictionless flight booking experience using ONLY conversation.

AVAILABLE TOOLS & ACTIONS:
1. search_locations: If the user mentions a city (e.g., "Paris") instead of an airport code, call this to find valid airports.
2. search_flights: When you have origin, destination, and departureDate.
3. book_flight: ONLY when a user says they want to book a specific flight. You MUST have:
   - Full Name
   - Email Address
   - Phone Number
   - Date of Birth
   - Gender
4. reply: For conversational responses, asking questions, or providing info.

CONVERSATION FLOW:
- Start with a warm greeting.
- If details are missing (e.g., return date, number of passengers), ask naturally.
- When results are found, highlight the "cheapest" or "best" options.
- TO INITIATE BOOKING: Once a user selects a flight, you MUST collect their Contact Details (Email, Phone) and Passenger Details (Name, DOB, Gender).

ALWAYS respond in JSON format:
{
  "text": "Your spoken response",
  "action": "search_flights" | "search_locations" | "book_flight" | "reply",
  "params": { ... }
}

Example for London:
{
  "text": "I'll search for airports in London for you.",
  "action": "search_locations",
  "params": { "keyword": "London" }
}

Be concise, friendly, and expert.
${!userId ? "\nIMPORTANT: The user is currently NOT LOGGED IN. If they try to book, you MUST politely tell them to sign in or create an account first to complete the booking." : ""}`,
        },
        {
          role: "assistant",
          content:
            "Welcome to Flybeth Travels! Where would you like to go today?",
        },
      ],
    });
  }

  /**
   * Clean up session data
   */
  endSession(clientId: string) {
    this.sessions.delete(clientId);
  }

  async processTranscript(clientId: string, transcript: string) {
    this.logger.log(`Processing transcript for ${clientId}: ${transcript}`);

    const aiResponse = await this.queryLLM(clientId, transcript);
    const session = this.sessions.get(clientId)!;

    // 1. Handle Location Search
    if (
      aiResponse.action === "search_locations" &&
      aiResponse.params?.keyword
    ) {
      try {
        const locations = await this.flightsService.searchLocations(
          aiResponse.params.keyword,
        );
        if (locations.length > 0) {
          const locationNames = locations
            .slice(0, 3)
            .map((l) => `${l.name} (${l.iataCode})`)
            .join(", ");
          const followUp = `I found a few airports in ${aiResponse.params.keyword}: ${locationNames}. Which one would you like to use?`;

          // Push follow-up to history so LLM knows what it just said
          session.messages.push({ role: "assistant", content: followUp });

          return { text: followUp, action: "reply" };
        } else {
          return {
            text: `I couldn't find any airports for "${aiResponse.params.keyword}". Could you specify the city again?`,
            action: "reply",
          };
        }
      } catch (error) {
        this.logger.error(`Location search failed: ${error.message}`);
        return {
          text: "I had trouble looking up that location. Could you try again?",
          action: "reply",
        };
      }
    }

    // 2. Handle Flight Search
    if (aiResponse.action === "search_flights" && aiResponse.params) {
      try {
        const searchResults = await this.flightsService.search(
          aiResponse.params,
        );
        const results = searchResults.results;

        if (results.length > 0) {
          // Cache results in session for booking
          session.latestResults = results;

          const cheapest = results[0];
          const count = results.length;
          const responseText = `I found ${count} flight options. The cheapest is with ${cheapest.airline} at $${cheapest.priceWithCommission}. ${aiResponse.text}`;

          return {
            text: responseText,
            data: results.slice(0, 3),
            action: "show_results",
          };
        } else {
          return {
            text: "I couldn't find any flights for those details. Would you like to try a different date or city?",
            action: "reply",
          };
        }
      } catch (error) {
        this.logger.error(`Flight search failed: ${error.message}`);
        return {
          text: "I'm having trouble searching for flights right now. Let's try again in a moment.",
          action: "reply",
        };
      }
    }

    // 3. Handle Booking Flow
    if (aiResponse.action === "book_flight" && aiResponse.params) {
      this.logger.log(
        `Booking intent detected: ${JSON.stringify(aiResponse.params)}`,
      );

      if (!session.latestResults || session.latestResults.length === 0) {
        return {
          text: "I'm sorry, I don't see any flight options recently discussed. Could we search for your flights again?",
          action: "reply",
        };
      }

      // For now, assume we book the first (cheapest) flight if not specified
      const selectedFlight = session.latestResults[0];

      try {
        // CREATE REAL BOOKING RECORD
        if (!session.userId) {
          return {
            text: "I'd love to book that for you, but you'll need to sign in to your account first. Once you're logged in, just tell me 'Book it' again!",
            action: "reply",
          };
        }

        const booking = await this.bookingsService.create(session.userId, {
          flights: [
            {
              flightId: selectedFlight._id || selectedFlight.offerId,
              class: selectedFlight.class || "economy",
              passengerIds: [],
              offerId: selectedFlight.offerId,
              provider: selectedFlight.provider || "duffel",
            },
          ],
          contactDetails: {
            email: aiResponse.params.email || "guest@flybeth.com",
            phone: aiResponse.params.phone || "+000000000",
            name: aiResponse.params.fullName || "Guest User",
          },
          currency: selectedFlight.currency || "USD",
          notes: `Voice booking for ${aiResponse.params.fullName}. DOB: ${aiResponse.params.dob}. Gender: ${aiResponse.params.gender}`,
        });

        return {
          text: `Perfect! I've created your booking ${booking.pnr}. I'll transfer you to the checkout page now.`,
          action: "init_checkout",
          data: {
            bookingId: booking._id,
            pnr: booking.pnr,
            ...aiResponse.params,
          },
        };
      } catch (error) {
        this.logger.error(`Real booking creation failed: ${error.message}`);
        return {
          text: `I had trouble securing that booking. ${error.message}`,
          action: "reply",
        };
      }
    }

    return {
      text: aiResponse.text,
      action: aiResponse.action || "reply",
    };
  }

  private async queryLLM(clientId: string, text: string) {
    let apiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      return {
        text:
          "I'm sorry, I'm currently in offline mode. I heard you say: " + text,
        action: "reply",
      };
    }
    apiKey = apiKey.replace(/^["'](.+)["']$/, "$1");

    if (!this.sessions.has(clientId)) {
      this.initSession(clientId);
    }
    const session = this.sessions.get(clientId)!;

    session.messages.push({ role: "user", content: text });

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: session.messages,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      const assistantContent = response.data.choices[0].message.content;
      this.logger.debug(`Raw LLM Response: ${assistantContent}`);

      session.messages.push({ role: "assistant", content: assistantContent });

      try {
        return JSON.parse(assistantContent);
      } catch (parseError) {
        this.logger.error(
          `JSON Parse Error: ${parseError.message}. Content: ${assistantContent}`,
        );
        throw new Error(`AI returned invalid JSON: ${parseError.message}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(
          `OpenAI API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
        throw new Error(
          `OpenAI API Error: ${error.response.data?.error?.message || error.message}`,
        );
      }
      this.logger.error(`LLM Query Failed: ${error.message}`);
      throw error;
    }
  }
}
