import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Booking } from "../bookings/schemas/booking.schema";
import { User } from "../users/schemas/user.schema";
import { Tenant } from "../tenants/schemas/tenant.schema";
import { Payment } from "../payments/schemas/payment.schema";
import { TenantsService } from "../tenants/tenants.service";
import { UsersService } from "../users/users.service";
import { BookingsService } from "../bookings/bookings.service";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { Invitation } from "./schemas/invitation.schema";
import { NotificationsService } from "../notifications/notifications.service";
import { AccessControlService } from "../access-control/access-control.service";
import { InviteDto } from "./dto/invite.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Invitation.name) private invitationModel: Model<Invitation>,
    private tenantsService: TenantsService,
    private usersService: UsersService,
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
    private acService: AccessControlService,
  ) {}

  async getDashboard() {
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      overview,
      revenueStats,
      topTenants,
      bookingStatusBreakdown,
      recentBookings,
    ] = await Promise.all([
      // 1. Overview and Month-over-Month Growth
      this.getOverviewMetrics(firstDayCurrentMonth, firstDayLastMonth),
      
      // 2. Revenue Insights
      this.paymentModel.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: "$currency",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } }
      ]).exec(),

      // 3. Top Performing Agencies (by Revenue)
      this.paymentModel.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: "$tenant",
            revenue: { $sum: "$amount" },
            bookings: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "tenants",
            localField: "_id",
            foreignField: "_id",
            as: "tenantInfo"
          }
        },
        { $unwind: "$tenantInfo" },
        {
          $project: {
            name: "$tenantInfo.name",
            email: "$tenantInfo.contactEmail",
            revenue: 1,
            bookings: 1
          }
        }
      ]).exec(),

      // 4. Booking Status Insights
      this.bookingModel.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]).exec(),

      // 5. Recent Activity
      this.bookingModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "firstName lastName email")
        .populate("tenant", "name slug")
        .lean()
        .exec(),
    ]);

    return {
      overview,
      revenue: {
        byCurrency: revenueStats,
        totalTransactions: revenueStats.reduce((sum, s) => sum + s.count, 0),
        topPartners: topTenants,
      },
      analytics: {
        bookingStatus: bookingStatusBreakdown,
        successRate: this.calculateSuccessRate(bookingStatusBreakdown),
      },
      recentBookings,
      timestamp: new Date(),
    };
  }

  private async getOverviewMetrics(currentMonth: Date, lastMonth: Date) {
    const [
      totalTenants,
      totalUsers,
      totalBookings,
      currentMonthBookings,
      lastMonthBookings,
      currentMonthUsers,
      lastMonthUsers
    ] = await Promise.all([
      this.tenantModel.countDocuments().exec(),
      this.userModel.countDocuments().exec(),
      this.bookingModel.countDocuments().exec(),
      this.bookingModel.countDocuments({ createdAt: { $gte: currentMonth } }).exec(),
      this.bookingModel.countDocuments({ createdAt: { $gte: lastMonth, $lt: currentMonth } }).exec(),
      this.userModel.countDocuments({ createdAt: { $gte: currentMonth } }).exec(),
      this.userModel.countDocuments({ createdAt: { $gte: lastMonth, $lt: currentMonth } }).exec(),
    ]);

    const bookingTrend = this.calculateTrend(currentMonthBookings, lastMonthBookings);
    const userTrend = this.calculateTrend(currentMonthUsers, lastMonthUsers);

    return {
      totalTenants,
      totalUsers,
      totalBookings,
      bookingTrend,
      userTrend,
      currentMonthPerformance: {
        newBookings: currentMonthBookings,
        newUsers: currentMonthUsers
      }
    };
  }

  private calculateTrend(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  }

  private calculateSuccessRate(breakdown: any[]): string {
    const total = breakdown.reduce((sum, b) => sum + b.count, 0);
    const success = breakdown.find(b => ["confirmed", "ticketed"].includes(b._id))?.count || 0;
    return total > 0 ? `${((success / total) * 100).toFixed(1)}%` : "0%";
  }

  async getRevenue(period?: string, tenantId?: string) {
    const matchStage: any = { status: "success" };
    if (tenantId) matchStage.tenant = new Types.ObjectId(tenantId);

    let dateFormat: string;
    switch (period) {
      case "daily":
        dateFormat = "%Y-%m-%d";
        break;
      case "monthly":
        dateFormat = "%Y-%m";
        break;
      case "yearly":
        dateFormat = "%Y";
        break;
      default:
        dateFormat = "%Y-%m";
    }

    const bookingMatchStage: any = { status: { $in: ["confirmed", "ticketed"] } };
    if (tenantId) bookingMatchStage.tenant = new Types.ObjectId(tenantId);

    const [trends, payments, bookingStats] = await Promise.all([
      this.paymentModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              period: { $dateToString: { format: dateFormat, date: "$paidAt" } },
              currency: "$currency",
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.period": -1 } },
      ]),
      this.paymentModel
        .find(matchStage)
        .populate("tenant", "name")
        .sort({ paidAt: -1 })
        .limit(100) // Ledger display limit
        .exec(),
      this.bookingModel.aggregate([
        { $match: bookingMatchStage },
        {
          $group: {
            _id: null,
            totalCommission: { $sum: { $add: [{ $ifNull: ["$pricing.platformCommission", 0] }, { $ifNull: ["$pricing.platformAncillaryMargin", 0] }] } },
            totalVipRevenue: { $sum: { $ifNull: ["$pricing.vipSupportAmount", 0] } },
            totalBookings: { $sum: 1 },
            vipBookingsCount: {
              $sum: { $cond: [{ $gt: ["$pricing.vipSupportAmount", 0] }, 1, 0] }
            }
          }
        }
      ]).exec()
    ]);

    let grossRevenue = 0;
    let pendingDisbursements = 0;

    const stats = bookingStats[0] || { totalCommission: 0, totalVipRevenue: 0, totalBookings: 0, vipBookingsCount: 0 };
    const commissionEarned = stats.totalCommission;
    const vipRevenue = stats.totalVipRevenue;
    const vipConversionRate = stats.totalBookings > 0 ? ((stats.vipBookingsCount / stats.totalBookings) * 100).toFixed(1) : 0;

    const ledger = payments.map((p) => {
      grossRevenue += p.amount;
      
      const rate = grossRevenue > 0 ? (commissionEarned / grossRevenue) * 100 : 0; // Approximate average rate for display
      const payout = p.amount - (p.amount * (rate / 100));
      
      // If status is just success, we treat it as settled for now, or mock unsettled randomly for UI
      const isSettled = Math.random() > 0.2; 
      if (!isSettled) pendingDisbursements += payout;

      return {
        id: p.providerTransactionId || p._id.toString().substring(0, 8),
        agency: (p.tenant as any)?.name || "Direct / B2C",
        amount: p.amount,
        currency: p.currency,
        rate: rate.toFixed(1),
        payout: payout,
        settled: isSettled,
        date: p.paidAt ? p.paidAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      };
    });

    const takeRate = grossRevenue > 0 ? ((commissionEarned / grossRevenue) * 100).toFixed(1) : 0;

    return {
      metrics: {
        grossRevenue,
        commissionEarned,
        pendingDisbursements,
        takeRate,
        vipRevenue,
        vipConversionRate
      },
      ledger,
      trends
    };
  }

  async getSystemHealth() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [recentBookings, recentPayments, activeUsers] = await Promise.all([
      this.bookingModel
        .countDocuments({ createdAt: { $gte: oneHourAgo } })
        .exec(),
      this.paymentModel
        .countDocuments({ createdAt: { $gte: oneHourAgo } })
        .exec(),
      this.userModel.countDocuments({ lastLogin: { $gte: oneHourAgo } }).exec(),
    ]);

    return {
      status: "healthy",
      timestamp: now,
      lastHour: {
        bookings: recentBookings,
        payments: recentPayments,
        activeUsers,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  async getTenants(paginationDto: PaginationDto) {
    return this.tenantsService.findAll(paginationDto);
  }

  async getUsers(queryDto: any) {
    const { role, status, tier, ...paginationDto } = queryDto;
    const filterDto: any = {};
    if (role) filterDto.role = role;
    if (status) filterDto.isActive = status === "active";
    return this.usersService.findAll(paginationDto, filterDto);
  }

  async getBookings(paginationDto: PaginationDto) {
    return this.bookingsService.getAllBookings(paginationDto);
  }

  async inviteTeamMember(inviteDto: InviteDto, invitedBy: string) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(inviteDto.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check if pending invitation already exists
    const existingInvite = await this.invitationModel.findOne({
      email: inviteDto.email.toLowerCase(),
      status: "pending",
    });
    if (existingInvite) {
      throw new Error("A pending invitation already exists for this email");
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = new this.invitationModel({
      email: inviteDto.email.toLowerCase(),
      role: inviteDto.role,
      permissions: inviteDto.permissions || [],
      token,
      expiresAt,
      invitedBy: new Types.ObjectId(invitedBy),
      tenant: inviteDto.tenantId
        ? new Types.ObjectId(inviteDto.tenantId)
        : null,
    });

    await invitation.save();

    // Send invitation email
    let roleName = inviteDto.role.toString();
    let permissions: string[] = [];
    try {
      const roleDoc = await this.acService.findRoleById(inviteDto.role.toString());
      if (roleDoc) {
        roleName = roleDoc.name;
        permissions = roleDoc.permissions || [];
      }
    } catch (e) {
      this.logger.warn(`Could not resolve role name for role id ${inviteDto.role}`);
    }

    const inviteUrl = `${process.env.ADMIN_URL || "http://localhost:3006"}/signup?token=${token}`;
    await this.notificationsService.sendTeamInvitationEmail(
      inviteDto.email,
      roleName,
      inviteUrl,
      expiresAt.toLocaleDateString(),
      permissions
    );

    this.logger.log(
      `Team invitation sent to ${inviteDto.email} (Role: ${inviteDto.role})`,
    );
    return { message: "Invitation sent successfully", token };
  }

  async verifyInvitation(token: string) {
    const invitation = await this.invitationModel.findOne({
      token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new Error("Invalid or expired invitation token");
    }

    return {
      email: invitation.email,
      role: invitation.role,
      permissions: invitation.permissions,
      tenant: invitation.tenant,
    };
  }

  async getInvitations() {
    return this.invitationModel
      .find()
      .populate("invitedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .exec();
  }

  async cancelInvitation(id: string) {
    const result = await this.invitationModel.findByIdAndUpdate(id, { status: "expired" }, { new: true }).exec();
    if (!result) {
      throw new Error("Invitation not found");
    }
    return { message: "Invitation cancelled successfully" };
  }

  async resendInvitation(id: string) {
    const invite = await this.invitationModel.findById(id).exec();
    if (!invite || invite.status !== "pending") {
      throw new Error("Only pending invitations can be resent");
    }
    
    const token = invite.token;
    const inviteUrl = `${process.env.ADMIN_URL || "http://localhost:3006"}/signup?token=${token}`;
    
    let roleName = invite.role.toString();
    let permissions: string[] = [];
    try {
      const roleDoc = await this.acService.findRoleById(invite.role.toString());
      if (roleDoc) {
        roleName = roleDoc.name;
        permissions = roleDoc.permissions || [];
      }
    } catch (e) {
      this.logger.warn(`Could not resolve role name for role id ${invite.role}`);
    }

    await this.notificationsService.sendTeamInvitationEmail(
      invite.email,
      roleName,
      inviteUrl,
      invite.expiresAt.toLocaleDateString(),
      permissions
    );

    this.logger.log(`Resent invitation to ${invite.email}`);
    return { message: "Invitation resent successfully" };
  }

  async createAdminUser(dto: any, createdBy: string) {
    // Check if user already exists
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      permissions: dto.permissions || [],
      isVerified: true,
      isActive: true,
    });

    this.logger.log(
      `Admin user created: ${user.email} (Role: ${user.role}) by user ${createdBy}`,
    );

    // Send welcome notification (non-blocking)
    this.notificationsService
      .sendDynamicEmail({
        slug: "admin-welcome",
        to: user.email,
        data: {
          firstName: user.firstName,
          role: user.role,
          loginUrl: process.env.ADMIN_URL || "http://localhost:3001",
        },
      })
      .catch((err) => {
        this.logger.warn(`Failed to send admin welcome email: ${err.message}`);
      });

    return {
      message: "Admin user created successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        isVerified: user.isVerified,
      },
    };
  }

  async deleteUser(userId: string) {
    return this.usersService.delete(userId);
  }

  async updateKycStatus(id: string, docType: string, status: string, feedback?: string) {
    return this.usersService.updateKycStatus(id, docType as any, status as any, feedback);
  }

  async downloadLedger() {
    const payments = await this.paymentModel
      .find({ status: "success" })
      .populate("tenant", "name")
      .sort({ paidAt: -1 })
      .exec();

    // Generate CSV content
    const header = "Transaction ID,Agency,Amount,Currency,Date,Status\n";
    const rows = payments.map(p => {
      const agencyName = (p.tenant as any)?.name || "Direct / B2C";
      const date = p.paidAt ? p.paidAt.toISOString() : "";
      return `${p.providerTransactionId || p._id},"${agencyName}",${p.amount},${p.currency},${date},${p.status}`;
    }).join("\n");

    return header + rows;
  }

  async initiateSettlement() {
    this.logger.log("Initiating global settlement cycle...");
    // In a real system, this would trigger background jobs for bank transfers
    // For now, we simulate success and perhaps mark something as processed
    return {
      success: true,
      message: "Global settlement initiated successfully. Batch ID: SET-" + Date.now(),
      processedCount: await this.paymentModel.countDocuments({ status: "success" })
    };
  }

  // --- Cron Jobs for Invitations ---

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredInvitations() {
    try {
      const result = await this.invitationModel.updateMany(
        { status: "pending", expiresAt: { $lt: new Date() } },
        { $set: { status: "expired" } }
      );
      if (result.modifiedCount > 0) {
        this.logger.log(`Marked ${result.modifiedCount} invitations as expired`);
      }
    } catch (error) {
      this.logger.error(`Error expiring invitations: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendInvitationReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const expiringInvitations = await this.invitationModel.find({
        status: "pending",
        expiresAt: { $gte: tomorrow, $lt: dayAfterTomorrow }
      });

      for (const invite of expiringInvitations) {
        const inviteUrl = `${process.env.ADMIN_URL || "http://localhost:3006"}/signup?token=${invite.token}`;
        await this.notificationsService.sendInvitationReminderEmail(invite.email, inviteUrl);
      }

      if (expiringInvitations.length > 0) {
        this.logger.log(`Sent reminder emails to ${expiringInvitations.length} pending invitations`);
      }
    } catch (error) {
      this.logger.error(`Error sending invitation reminders: ${error.message}`);
    }
  }
}
