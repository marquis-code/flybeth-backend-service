import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Booking, BookingDocument } from "../bookings/schemas/booking.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { TrackingEvent, TrackingEventDocument } from "../tracking/schemas/tracking-event.schema";

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TrackingEvent.name) private eventModel: Model<TrackingEventDocument>,
  ) {}

  async getStats() {
    const [totalBookings, highRiskCount, totalEvents] = await Promise.all([
      this.bookingModel.countDocuments(),
      this.bookingModel.countDocuments({ riskScore: { $gte: 70 } }),
      this.eventModel.countDocuments({ type: 'user_journey' })
    ]);

    const stats = {
      riskLevel: highRiskCount > 10 ? 'High' : highRiskCount > 5 ? 'Medium' : 'Low',
      highRiskBookings: highRiskCount,
      activeBotThreats: 0, // Calculated below
      securityScore: Math.max(100 - (highRiskCount * 5), 0),
      totalEventsAnalyzed: totalEvents
    };

    // Simple bot threat estimation: IPs with > 20 events in last hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const botThreats = await this.eventModel.aggregate([
      { $match: { createdAt: { $gte: hourAgo } } },
      { $group: { _id: "$ipAddress", count: { $sum: 1 } } },
      { $match: { count: { $gt: 20 } } }
    ]);
    
    stats.activeBotThreats = botThreats.length;

    return stats;
  }

  async getHighRiskBookings() {
    return this.bookingModel.find({ riskScore: { $gte: 30 } })
      .sort({ riskScore: -1 })
      .limit(50)
      .populate('user', 'firstName lastName email')
      .exec();
  }

  async getBotEvents() {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.eventModel.aggregate([
      { $match: { createdAt: { $gte: hourAgo } } },
      { $group: { 
          _id: "$ipAddress", 
          eventCount: { $sum: 1 },
          lastEvent: { $max: "$createdAt" },
          userAgent: { $first: "$userAgent" }
        } 
      },
      { $match: { eventCount: { $gt: 10 } } },
      { $sort: { eventCount: -1 } }
    ]);
  }

  async calculateRiskScore(
    bookingId: string,
  ): Promise<{ score: number; signals: string[] }> {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate("user")
      .exec();
    if (!booking) return { score: 0, signals: [] };

    let score = 0;
    const signals: string[] = [];

    // 1. High value check (>$1500)
    if (booking.pricing.totalAmount > 1500) {
      score += 30;
      signals.push("High value transaction");
    }

    // 2. Last-minute check (< 24h)
    const now = new Date();
    const flightDate = booking.flights?.[0]?.flight
      ? (booking as any).flights[0].departureDate
      : null; // Simplified
    if (
      flightDate &&
      new Date(flightDate).getTime() - now.getTime() < 24 * 60 * 60 * 1000
    ) {
      score += 25;
      signals.push("Last-minute international flight");
    }

    // 3. Velocity check (Same IP)
    if (booking.ipAddress) {
      const recentFromIp = await this.bookingModel.countDocuments({
        ipAddress: booking.ipAddress,
        createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
        _id: { $ne: booking._id },
      });
      if (recentFromIp > 2) {
        score += 40;
        signals.push("Multiple bookings from same IP in 1 hour");
      }
    }

    // 4. New account check
    if (booking.user && (booking.user as any).createdAt) {
      const userCreated = new Date((booking.user as any).createdAt);
      if (now.getTime() - userCreated.getTime() < 6 * 60 * 60 * 1000) {
        // < 6 hours
        score += 20;
        signals.push("New user account");
      }
    }

    // Clamp score at 100
    const finalScore = Math.min(score, 100);

    // Update booking with score and signals
    await this.bookingModel.findByIdAndUpdate(bookingId, {
      riskScore: finalScore,
      fraudSignals: signals,
    });

    this.logger.log(
      `Booking ${booking.pnr} risk score: ${finalScore} [${signals.join(", ")}]`,
    );

    return { score: finalScore, signals };
  }

  async updateBookingFraudStatus(id: string, status: 'approved' | 'rejected') {
    const riskScore = status === 'approved' ? 0 : 100;
    const signals = status === 'approved' ? ['Manually approved by admin'] : ['Manually rejected as fraud by admin'];
    
    return this.bookingModel.findByIdAndUpdate(id, {
      riskScore,
      fraudSignals: signals,
      notes: `Fraud status updated to ${status} on ${new Date().toISOString()}`
    }, { new: true });
  }
}
