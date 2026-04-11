import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Req,
  UseGuards,
  Param,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { UserQueryDto } from "./dto/user-query.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Role, Permission } from "../../common/constants/roles.constant";
import { InviteDto } from "./dto/invite.dto";
import { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import { Public } from "../../common/decorators/public.decorator";
import { CommissionDto } from "./dto/commission.dto";
import { CampaignDto } from "./dto/campaign.dto";
import { CommissionsService } from "../flights/commissions.service";
import { CampaignsService } from "../campaigns/campaigns.service";
import { SchedulerService } from "../scheduler/scheduler.service";
import { UploadService } from "../upload/upload.service";

import { SeedService } from "../seed/seed.service";

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(RolesGuard, PermissionsGuard)
@Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.STAFF)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly commissionsService: CommissionsService,
    private readonly campaignsService: CampaignsService,
    private readonly schedulerService: SchedulerService,
    private readonly uploadService: UploadService,
    private readonly seedService: SeedService,
  ) {}

  @Post("system-seed")
  @ApiOperation({ summary: "Force trigger global system seeding" })
  @Roles(Role.SUPER_ADMIN)
  triggerGlobalSeed() {
    return this.seedService.onModuleInit();
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Get admin dashboard overview" })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("revenue")
  @ApiOperation({ summary: "Get revenue reports" })
  getRevenue(
    @Query("period") period?: string,
    @Query("tenantId") tenantId?: string,
  ) {
    return this.adminService.getRevenue(period, tenantId);
  }

  @Get("revenue/ledger")
  @ApiOperation({ summary: "Download revenue ledger CSV" })
  @Roles(Role.SUPER_ADMIN)
  async downloadLedger(@Res() res: Response) {
    const csv = await this.adminService.downloadLedger();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="ledger.csv"');
    return res.send(csv);
  }

  @Post("revenue/settle")
  @ApiOperation({ summary: "Initiate global settlement" })
  @Roles(Role.SUPER_ADMIN)
  initiateSettlement() {
    return this.adminService.initiateSettlement();
  }

  @Get("tenants")
  @ApiOperation({ summary: "List all tenants" })
  getTenants(@Query() paginationDto: PaginationDto) {
    return this.adminService.getTenants(paginationDto);
  }

  @Get("users")
  @ApiOperation({ summary: "List all users" })
  getUsers(@Query() queryDto: UserQueryDto) {
    return this.adminService.getUsers(queryDto);
  }

  @Get("bookings")
  @ApiOperation({ summary: "List all bookings" })
  getBookings(@Query() paginationDto: PaginationDto) {
    return this.adminService.getBookings(paginationDto);
  }

  @Get("system-health")
  @ApiOperation({ summary: "Get system health status" })
  @Roles(Role.SUPER_ADMIN)
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Post("invite")
  @ApiOperation({ summary: "Invite a team member" })
  @Permissions(Permission.INVITE_MEMBERS)
  inviteTeamMember(@Body() inviteDto: InviteDto, @Req() req: any) {
    return this.adminService.inviteTeamMember(
      inviteDto,
      req.user?._id || req.user?.sub,
    );
  }

  @Get("invitations")
  @ApiOperation({ summary: "List team invitations" })
  @Permissions(Permission.INVITE_MEMBERS)
  getInvitations() {
    return this.adminService.getInvitations();
  }

  @Delete("invitations/:id")
  @ApiOperation({ summary: "Cancel an invitation" })
  @Permissions(Permission.INVITE_MEMBERS)
  cancelInvitation(@Query("id") id: string) {
    return this.adminService.cancelInvitation(id);
  }

  // --- Commission Management ---
  @Get("commissions")
  @ApiOperation({ summary: "List airline commissions" })
  @Permissions(Permission.MANAGE_COMMISSIONS)
  getCommissions() {
    return this.commissionsService.findAll();
  }

  @Post("commissions")
  @ApiOperation({ summary: "Set or update airline commission" })
  @Permissions(Permission.MANAGE_COMMISSIONS)
  upsertCommission(@Body() commissionDto: CommissionDto) {
    return this.commissionsService.upsert(commissionDto);
  }

  @Delete("commissions/:id")
  @ApiOperation({ summary: "Delete airline commission" })
  @Permissions(Permission.MANAGE_COMMISSIONS)
  deleteCommission(@Param("id") id: string) {
    return this.commissionsService.delete(id);
  }

  // --- Campaign Management ---
  @Get("campaigns")
  @ApiOperation({ summary: "List email campaigns" })
  getCampaigns() {
    return this.campaignsService.findAll();
  }

  @Post("campaigns/seed")
  @ApiOperation({ summary: "Seed default email campaigns" })
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  seedCampaigns() {
    return this.campaignsService.seedDefaultCampaigns();
  }

  @Post("campaigns")
  @ApiOperation({ summary: "Create or update email campaign" })
  @Permissions(Permission.MANAGE_CAMPAIGNS)
  upsertCampaign(@Body() campaignDto: CampaignDto, @Req() req: any) {
    return this.campaignsService.create({
      ...campaignDto,
      createdBy: req.user?._id || req.user?.sub,
    });
  }

  @Put("campaigns/:id")
  @ApiOperation({ summary: "Update an existing email campaign" })
  @Permissions(Permission.MANAGE_CAMPAIGNS)
  updateCampaign(@Param("id") id: string, @Body() campaignDto: CampaignDto) {
    return this.campaignsService.update(id, campaignDto);
  }

  @Post("campaigns/:id/send")
  @ApiOperation({ summary: "Send email campaign blast" })
  @Permissions(Permission.MANAGE_CAMPAIGNS)
  sendCampaign(@Param("id") id: string) {
    return this.campaignsService.sendCampaign(id);
  }

  @Delete("campaigns/:id")
  @ApiOperation({ summary: "Delete email campaign" })
  @Permissions(Permission.MANAGE_CAMPAIGNS)
  deleteCampaign(@Param("id") id: string) {
    return this.campaignsService.delete(id);
  }

  @Post("scheduler/trigger-user-reminders")
  @ApiOperation({ summary: "Manually trigger user engagement email reminders" })
  @Roles(Role.SUPER_ADMIN)
  triggerUserReminders() {
    return this.schedulerService.sendUserReminders();
  }

  @Post("users/create")
  @ApiOperation({ summary: "Create an admin/staff user (Super Admin only)" })
  @Roles(Role.SUPER_ADMIN)
  createAdminUser(
    @Body() createAdminUserDto: CreateAdminUserDto,
    @Req() req: any,
  ) {
    return this.adminService.createAdminUser(
      createAdminUserDto,
      req.user?._id || req.user?.sub,
    );
  }

  @Get("invitations/verify/:token")
  @ApiOperation({ summary: "Verify invitation token and get details" })
  verifyInvitation(@Param("token") token: string) {
    return this.adminService.verifyInvitation(token);
  }

  @Delete("users/:id")
  @ApiOperation({ summary: "Delete an admin/staff user (Super Admin only)" })
  @Roles(Role.SUPER_ADMIN)
  deleteUser(@Param("id") id: string) {
    return this.adminService.deleteUser(id);
  }

  // --- File Storage Management ---
  @Get("storage")
  @ApiOperation({ summary: "List all stored files" })
  getFiles(@Query("folder") folder?: string) {
    return this.uploadService.listFiles(folder);
  }

  @Delete("storage/:publicId")
  @ApiOperation({ summary: "Delete a stored file" })
  deleteFile(@Param("publicId") publicId: string) {
    return this.uploadService.deleteFile(publicId);
  }
  @Post("users/:id/kyc-status")
  @ApiOperation({ summary: "Update status for a specific KYC document" })
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  updateKycStatus(
    @Param("id") id: string,
    @Body() kycData: { docType: any; status: any; feedback?: string },
  ) {
    return this.adminService.updateKycStatus(
      id,
      kycData.docType,
      kycData.status,
      kycData.feedback,
    );
  }
}
