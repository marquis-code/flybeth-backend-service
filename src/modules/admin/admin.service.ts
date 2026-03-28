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
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalBookings,
      revenueStats,
      recentBookings,
    ] = await Promise.all([
      this.tenantModel.countDocuments().exec(),
      this.tenantModel.countDocuments({ status: "active" }).exec(),
      this.userModel.countDocuments().exec(),
      this.bookingModel.countDocuments().exec(),
      this.paymentModel
        .aggregate([
          { $match: { status: "success" } },
          {
            $group: {
              _id: "$currency",
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
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
      overview: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalBookings,
      },
      revenue: {
        byCurrency: revenueStats,
        totalTransactions: revenueStats.reduce((sum, s) => sum + s.count, 0),
      },
      recentBookings,
    };
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

  async getUsers(paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
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
      tenant: inviteDto.tenantId ? new Types.ObjectId(inviteDto.tenantId) : null,
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

    this.logger.log(`Team invitation sent to ${inviteDto.email} (Role: ${inviteDto.role})`);
    return { message: "Invitation sent successfully", token };
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
}
