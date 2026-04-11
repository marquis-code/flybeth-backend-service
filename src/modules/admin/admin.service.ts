// src/modules/admin/admin.service.ts
import { Injectable, Logger } from "@nestjs/common";
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

    // Time-based grouping
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

    const revenue = await this.paymentModel
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              period: {
                $dateToString: { format: dateFormat, date: "$paidAt" },
              },
              currency: "$currency",
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.period": -1 } },
      ])
      .exec();

    return revenue;
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
    await this.notificationsService.sendDynamicEmail({
      slug: "team-invitation",
      to: inviteDto.email,
      data: {
        inviteUrl: `${process.env.ADMIN_URL || "http://localhost:3001"}/signup?token=${token}`,
        role: inviteDto.role,
        expiresAt: expiresAt.toLocaleDateString(),
      },
    });

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
    const result = await this.invitationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new Error("Invitation not found");
    }
    return { message: "Invitation cancelled successfully" };
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
}
