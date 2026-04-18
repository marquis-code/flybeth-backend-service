// src/modules/tracking/tracking.service.ts
import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ChatGateway } from "../chat/chat.gateway";
import { ChatService } from "../chat/chat.service";
import {
  TrackingEvent,
  TrackingEventDocument,
} from "./schemas/tracking-event.schema";

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectModel(TrackingEvent.name)
    private eventModel: Model<TrackingEventDocument>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  private readonly ASSISTANT_MESSAGES = {
    'booking_step_search': "👋 Welcome to Flybeth! I see you're exploring destinations. If you're looking for our exclusive wholesale rates or the best airline pairings, I'm right here to assist you.",
    'booking_step_review': "You've made an excellent choice! I'm reviewing your selection to ensure you're getting the absolute best value. Feel free to ask if you have any questions about the itinerary.",
    'booking_step_passengers': "Setting up your travelers? Ensuring name accuracy with your travel documents is vital. If you're traveling as a group or have special requests, let me know!",
    'booking_step_customization': "Enhance your journey! From extra legroom to specialized meals, I can help you secure the best add-ons for a comfortable flight.",
    'booking_step_payment': "Ready to confirm? Our payment gateway is secure and encrypted. If you encounter any issues or have a promo code to apply, I'm on standby to help.",
    'booking_completed': "✈️ Congratulations! Your booking is confirmed. I've sent the details to your email. Reach out if you need assistance with check-in or airport transfers.",
    'onboarding_started': "Welcome to the Flybeth Agent Network! 🚀 I'm your dedicated onboarding assistant. Let's get your agency set up for global growth.",
    'onboarding_business': "Tell us about your reach. Flybeth offers localized inventory across Africa and the world. Need help selecting your target regions?",
    'onboarding_kyc': "We take security seriously. If you're having any trouble capturing your selfie or uploading documents, I can guide you through it live.",
    'onboarding_compliance': "Ensuring regional compliance helps build trust. If you're unsure about the documentation required for your country, just ask.",
    'onboarding_payout': "Where should we send your earnings? 💰 Our payout system is automated. If you need assistance with bank verification, I'm here.",
    'onboarding_final': "You're at the finish line! Review the agreements carefully. Once you submit, our team will prioritize your application for approval.",
    'navigated_to_pricing': "Scaling your agency? Our membership tiers are designed for high-volume growth. I can help you pick the plan that maximizes your commission potential.",
  };

  async logUserJourney(
    userId: string | null,
    event: string,
    metadata: any = {},
    ip?: string,
    agent?: string,
    roomId?: string,
  ) {
    const log = new this.eventModel({
      type: "user_journey",
      entityId: userId || metadata.guestId || "anonymous",
      user: userId,
      event,
      metadata,
      ipAddress: ip,
      userAgent: agent,
    });
    
    const saved = await log.save();

    // ─── AGGRESSIVE Admin Monitoring ─────────────────────────────────
    this.chatGateway.broadcastToAdmins('user_tracking_alert', {
      userId: userId || metadata.guestId || 'Guest',
      event,
      metadata,
      timestamp: new Date().toISOString()
    });

    // ─── AGGRESSIVE Chat Assistant ───────────────────────────────────
    if (this.ASSISTANT_MESSAGES[event]) {
       try {
          let targetRoomId = roomId;

          // If no roomId, try to find or create one proactively
          if (!targetRoomId) {
             if (userId) {
                const room = await this.chatService.findOrCreateUserSupportRoom(
                   userId, 
                   metadata.userName || 'User', 
                   metadata.userEmail || ''
                );
                targetRoomId = String(room._id);
             } else if (metadata.email || metadata.userEmail) {
                const room = await this.chatService.findOrCreateGuestSupportRoom(
                   metadata.email || metadata.userEmail,
                   metadata.name || metadata.userName || 'Guest'
                );
                targetRoomId = String(room._id);
             }
          }

          if (targetRoomId) {
            // Send automated response to help the user
            const botMessage = await this.chatService.saveBotMessage(
              targetRoomId,
              this.ASSISTANT_MESSAGES[event],
              { trackingEvent: event, isAssistant: true }
            );
            
            // Broadcast to room
            this.chatGateway.server.to(targetRoomId).emit("newMessage", botMessage);
            // Also notify admins so they can see the bot's engagement
            this.chatGateway.broadcastToAdmins("newMessage", botMessage);
            
            this.logger.log(`[Assistant] Sent message for ${event} to room ${targetRoomId}`);
          }
       } catch (err) {
          this.logger.error(`[Assistant] Failed to send message: ${err.message}`);
       }
    }

    return saved;
  }

  async logFlightStatus(pnr: string, status: string, details: any) {
    this.logger.log(`Flight status update for PNR ${pnr}: ${status}`);
    const log = new this.eventModel({
      type: "flight_status",
      entityId: pnr,
      event: status,
      metadata: details,
    });
    return log.save();
  }

  async getUserHistory(userId: string) {
    return this.eventModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }

  async getFlightHistory(pnr: string) {
    return this.eventModel
      .find({ type: "flight_status", entityId: pnr })
      .sort({ createdAt: -1 })
      .exec();
  }
}
