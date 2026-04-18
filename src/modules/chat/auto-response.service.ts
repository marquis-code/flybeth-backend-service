// src/modules/chat/auto-response.service.ts
import { Injectable, Logger } from "@nestjs/common";

export interface FaqEntry {
  keywords: string[];
  question: string;
  answer: string;
  category: string;
}

@Injectable()
export class AutoResponseService {
  private readonly logger = new Logger(AutoResponseService.name);

  // ─── FAQ Knowledge Base ─────────────────────────────────────────────
  private readonly faqs: FaqEntry[] = [
    // Booking & Flights
    {
      keywords: ["book", "booking", "reserve", "reservation", "flight", "fly", "ticket"],
      question: "How do I book a flight?",
      answer: "You can book a flight by using our search widget on the homepage. Simply enter your departure city, destination, dates, and number of passengers, then click 'Search Flights'. You'll see available options from multiple airlines. Select your preferred flight and proceed to checkout. Need more help? An agent will be with you shortly!",
      category: "booking"
    },
    {
      keywords: ["cancel", "cancellation", "refund", "cancel booking", "cancel flight"],
      question: "How do I cancel a booking?",
      answer: "To cancel a booking, go to your Dashboard → My Bookings, find the booking you want to cancel, and click 'Cancel'. Cancellation policies vary by airline — most refundable tickets can be cancelled within 24 hours of booking for a full refund. For non-refundable tickets, cancellation fees may apply. If you need assistance with a specific cancellation, an agent will follow up shortly.",
      category: "booking"
    },
    {
      keywords: ["change", "modify", "reschedule", "change flight", "change date", "edit booking"],
      question: "Can I change my flight date?",
      answer: "Yes! You can modify your booking by visiting Dashboard → My Bookings and clicking 'Modify' on the relevant booking. Date changes are subject to availability and fare differences. Some tickets may have change fees. For complex modifications, I'll connect you with a live agent who can help.",
      category: "booking"
    },
    {
      keywords: ["baggage", "luggage", "bag", "carry on", "checked bag", "weight"],
      question: "What is the baggage allowance?",
      answer: "Baggage allowances vary by airline and fare class:\n• **Economy**: Usually 1 carry-on (7-10kg) + 1 checked bag (20-23kg)\n• **Business**: Usually 1 carry-on (10kg) + 2 checked bags (32kg each)\n• **First Class**: Usually 2 carry-ons + 3 checked bags (32kg each)\n\nYou can add extra baggage during booking or through your dashboard. Specific limits are shown on your booking confirmation.",
      category: "travel"
    },

    // Payments
    {
      keywords: ["pay", "payment", "price", "cost", "charge", "card", "credit", "debit", "paystack", "stripe"],
      question: "What payment methods do you accept?",
      answer: "We accept multiple payment methods:\n• **Credit/Debit Cards**: Visa, Mastercard, American Express\n• **Stripe**: For international payments\n• **Paystack**: For local payments in Nigeria and Africa\n• **Bank Transfer**: Available for select bookings\n\nAll payments are secured with 256-bit SSL encryption. You'll receive a confirmation email immediately after payment.",
      category: "payment"
    },
    {
      keywords: ["refund", "money back", "reimburse", "return money", "where is my refund"],
      question: "When will I receive my refund?",
      answer: "Refund processing times depend on the payment method:\n• **Credit/Debit Cards**: 5-10 business days\n• **Paystack**: 3-5 business days\n• **Stripe**: 5-7 business days\n• **Bank Transfer**: 7-14 business days\n\nYou can track your refund status in Dashboard → My Bookings. If your refund is taking longer than expected, I'll connect you with an agent.",
      category: "payment"
    },

    // Account
    {
      keywords: ["account", "register", "sign up", "create account", "login", "log in", "password", "forgot password"],
      question: "How do I create an account or reset my password?",
      answer: "**Create an Account**: Click 'Sign Up' on the homepage and fill in your details. You can also sign up using Google.\n\n**Reset Password**: Click 'Forgot Password' on the login page, enter your email address, and we'll send you a reset link.\n\n**Login Issues?**: Make sure you're using the correct email. If you continue to have problems, an agent will assist you.",
      category: "account"
    },

    // Hotels & Stays
    {
      keywords: ["hotel", "stay", "accommodation", "room", "lodge", "check in", "check out"],
      question: "How do I book a hotel?",
      answer: "To book a hotel:\n1. Switch to the 'Stays' tab on our search widget\n2. Enter your destination, check-in/out dates, and number of guests\n3. Browse available properties with photos, ratings, and prices\n4. Select your preferred room type and proceed to checkout\n\nWe aggregate deals from top providers like Hotelbeds for the best rates!",
      category: "stays"
    },

    // Cars & Transfers
    {
      keywords: ["car", "rent", "rental", "hire", "vehicle", "drive", "transfer", "pickup", "airport transfer"],
      question: "Do you offer car rentals or airport transfers?",
      answer: "Yes! We offer both:\n\n**Car Rentals**: Search and compare cars from top rental companies. Go to the 'Cars' tab to search.\n\n**Airport Transfers**: Book private or shared transfers from the 'Transfers' tab. Available at major airports worldwide.\n\nBoth services can be combined with your flight booking for a complete travel package!",
      category: "transport"
    },

    // Packages & Experiences
    {
      keywords: ["package", "deal", "bundle", "vacation", "holiday", "experience", "activity", "tour", "things to do"],
      question: "Do you have vacation packages?",
      answer: "Absolutely! We offer curated vacation packages that bundle flights + hotels + activities at discounted rates. Check our 'Packages' and 'Experiences' sections for:\n• Beach getaways\n• City breaks\n• Adventure tours\n• Cultural experiences\n\nPackages can save you up to 30% compared to booking separately!",
      category: "packages"
    },

    // Support & Contact
    {
      keywords: ["contact", "phone", "email", "reach", "call", "support", "help", "agent", "human", "person", "speak", "talk"],
      question: "How can I reach customer support?",
      answer: "You're already chatting with us! 🎉 Here are all the ways to reach Flybeth support:\n• **Live Chat**: You're using it right now! Available 24/7\n• **Email**: support@flybeth.com\n• **Dashboard**: Submit a support ticket from your account\n\nA human agent will be connected to this chat shortly if needed.",
      category: "support"
    },

    // Cruise
    {
      keywords: ["cruise", "ship", "sailing", "ocean", "sea voyage"],
      question: "Do you offer cruise bookings?",
      answer: "Yes! We offer cruise bookings through our 'Cruises' section. Browse itineraries from top cruise lines, compare cabin types, and book your dream ocean voyage. From Mediterranean cruises to Caribbean adventures — we've got you covered!",
      category: "cruises"
    },

    // General
    {
      keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greet"],
      question: "Greeting",
      answer: "Hello! 👋 Welcome to Flybeth Support! I'm your virtual assistant and I'm here to help you with:\n\n✈️ Flight bookings & changes\n🏨 Hotel reservations\n🚗 Car rentals & transfers\n💳 Payment questions\n📋 Booking management\n\nHow can I assist you today? Just type your question!",
      category: "greeting"
    },
    {
      keywords: ["thank", "thanks", "thank you", "bye", "goodbye", "see you"],
      question: "Thank you / Goodbye",
      answer: "You're welcome! 😊 Thank you for choosing Flybeth. If you need anything else, don't hesitate to reach out. We're available 24/7. Have a wonderful day! ✈️🌍",
      category: "farewell"
    },
    {
      keywords: ["status", "track", "where is", "booking status", "flight status", "confirmation"],
      question: "How do I check my booking status?",
      answer: "You can check your booking status in several ways:\n1. **Dashboard**: Go to Dashboard → My Bookings for real-time status\n2. **Email**: Check your booking confirmation email for details\n3. **Booking Reference**: Enter your booking reference number in our 'Track Booking' feature\n\nYour booking status will show: Confirmed, Pending, Cancelled, or Completed.",
      category: "booking"
    },
    {
      keywords: ["visa", "passport", "travel document", "immigration", "entry requirement"],
      question: "Do I need a visa for my destination?",
      answer: "Visa requirements depend on your nationality and destination. We recommend checking:\n1. Your destination country's embassy website\n2. IATA Travel Centre (iatatravelcentre.com)\n3. Your airline's travel advisory page\n\nFlybeth doesn't process visas, but we're happy to connect you with an agent who can provide general guidance for your specific trip.",
      category: "travel"
    },
  ];

  // ─── Bot Welcome Message ───────────────────────────────────────────
  getWelcomeMessage(): string {
    return "👋 Hi there! Welcome to Flybeth Support!\n\nI'm your virtual assistant. I can help you with:\n• ✈️ Booking flights\n• 🏨 Hotels & stays\n• 💳 Payment issues\n• 📋 Booking changes\n• 🚗 Car rentals & transfers\n\nJust type your question and I'll do my best to help! If I can't answer, I'll connect you with a live agent.";
  }

  // ─── Match and respond ─────────────────────────────────────────────
  findResponse(userMessage: string): { matched: boolean; response: string; confidence: number; category: string } {
    const normalizedMessage = userMessage.toLowerCase().trim();
    
    // Skip very short messages (single words like "ok", "yes") unless they're greetings
    if (normalizedMessage.length < 3) {
      return { matched: false, response: "", confidence: 0, category: "" };
    }

    let bestMatch: FaqEntry | null = null;
    let bestScore = 0;

    for (const faq of this.faqs) {
      let score = 0;
      let matchCount = 0;

      for (const keyword of faq.keywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          matchCount++;
          // Longer keywords are weighted higher for precision
          score += keyword.length;
        }
      }

      // Boost score based on percentage of keywords matched
      const matchRatio = matchCount / faq.keywords.length;
      const finalScore = score * (1 + matchRatio);

      if (finalScore > bestScore && matchCount >= 1) {
        bestScore = finalScore;
        bestMatch = faq;
      }
    }

    // Confidence threshold — require a minimum score to avoid false positives
    const confidence = bestMatch ? Math.min(bestScore / 15, 1) : 0;
    
    if (bestMatch && confidence >= 0.2) {
      this.logger.debug(`[AutoResponse] Matched FAQ: "${bestMatch.question}" (confidence: ${confidence.toFixed(2)})`);
      return {
        matched: true,
        response: bestMatch.answer,
        confidence,
        category: bestMatch.category
      };
    }

    // No match — escalation message
    this.logger.debug(`[AutoResponse] No FAQ matched for: "${userMessage}"`);
    return {
      matched: false,
      response: "",
      confidence: 0,
      category: ""
    };
  }

  // ─── Escalation message when bot can't answer ──────────────────────
  getEscalationMessage(): string {
    return "I appreciate your question! I don't have a specific answer for that, but I'm connecting you with a live support agent who can help. 🙋‍♂️\n\nA team member will respond shortly. In the meantime, feel free to share more details about your inquiry.";
  }

  // ─── Get all FAQ categories for admin ──────────────────────────────
  getAllFaqs(): FaqEntry[] {
    return this.faqs;
  }
}
