// src/modules/seed/seed.service.ts
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Airport,
  AirportDocument,
  Airline,
  AirlineDocument,
} from "../airports/schemas/airport.schema";
import {
  BankAccount,
  BankAccountDocument,
} from "../payments/schemas/bank-account.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { Role } from "../../common/constants/roles.constant";
import { hashPassword } from "../../common/utils/crypto.util";

import { RoleEntity, RoleDocument } from "../access-control/schemas/role.schema";
import { PermissionEntity, PermissionDocument } from "../access-control/schemas/permission.schema";

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Airport.name) private airportModel: Model<AirportDocument>,
    @InjectModel(Airline.name) private airlineModel: Model<AirlineDocument>,
    @InjectModel(BankAccount.name)
    private bankAccountModel: Model<BankAccountDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RoleEntity.name) private roleModel: Model<RoleDocument>,
    @InjectModel(PermissionEntity.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async onModuleInit() {
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedAirports();
    await this.seedAirlines();
    await this.seedBankAccounts();
    await this.seedAdminUser();
    await this.seedAgentUser();
    await this.seedCustomerUser();
  }

  private async seedPermissions() {
    const count = await this.permissionModel.countDocuments().exec();
    if (count > 0) return;

    const permissions = [
      { name: 'View Dashboard', key: 'view_dashboard', category: 'General', description: 'Access to system overview and metrics' },
      { name: 'Manage Agents', key: 'manage_agents', category: 'Infrastructure', description: 'Create, edit and suspend agency accounts' },
      { name: 'Manage Tenants', key: 'manage_tenants', category: 'Infrastructure', description: 'Control multi-tenant white-label portals' },
      { name: 'Manage Team', key: 'manage_team', category: 'Security', description: 'Manage internal admin and staff accounts' },
      { name: 'View Bookings', key: 'view_bookings', category: 'Operations', description: 'Monitor and search platform-wide transactions' },
      { name: 'Audit Revenue', key: 'audit_revenue', category: 'Finance', description: 'Access financial ledgers and settlement tools' },
      { name: 'Manage Storage', key: 'manage_storage', category: 'General', description: 'Manage asset library and file uploads' },
      { name: 'Manage Emails', key: 'manage_emails', category: 'Marketing', description: 'Edit system notification blueprints' },
      { name: 'Manage Campaigns', key: 'manage_campaigns', category: 'Marketing', description: 'Orchestrate marketing email blasts' },
      { name: 'Manage Fraud', key: 'manage_fraud', category: 'Security', description: 'Access security signals and risk modules' },
      { name: 'Manage Roles', key: 'manage_roles', category: 'Security', description: 'Define security tiers and permissions' },
      { name: 'Manage Settings', key: 'manage_settings', category: 'General', description: 'Configure global platform parameters' },
      { name: 'Invite Members', key: 'invite_members', category: 'Security', description: 'Trigger team invitation logic' },
      { name: 'Manage Commissions', key: 'manage_commissions', category: 'Finance', description: 'Set airline pricing overrides' },
    ];

    await this.permissionModel.insertMany(permissions);
    this.logger.log(`Seeded ${permissions.length} granular permissions`);
  }

  private async seedRoles() {
    const allPerms = await this.permissionModel.find().exec();
    const allKeys = allPerms.map(p => p.key);

    const roles = [
      {
        name: Role.SUPER_ADMIN,
        description: 'Ultimate system control. Unrestricted access to all modules.',
        permissions: allKeys,
        isDefault: true,
      },
      {
        name: Role.STAFF,
        description: 'Standard operational access for platform employees.',
        permissions: ['view_dashboard', 'view_bookings', 'manage_agents', 'manage_emails'],
        isDefault: true,
      },
      {
        name: Role.AGENT,
        description: 'Agency account for travel professionals.',
        permissions: ['view_dashboard', 'view_bookings'],
        isDefault: true,
      },
      {
        name: Role.CUSTOMER,
        description: 'Standard end-user account for travel bookings.',
        permissions: [],
        isDefault: true,
      },
    ];

    for (const r of roles) {
      await this.roleModel.updateOne({ name: r.name }, { $set: r }, { upsert: true });
    }
    this.logger.log(`Synchronized ${roles.length} system roles`);
    
    // Remediation: Fix existing users with string roles
    const usersWithLegacyRoles = await this.userModel.find({ role: { $type: 'string' } }).exec();
    for (const user of usersWithLegacyRoles) {
      const roleName = user.role as any;
      const roleEntity = await this.roleModel.findOne({ name: roleName }).exec();
      if (roleEntity) {
        await this.userModel.updateOne({ _id: user._id }, { role: roleEntity._id });
        this.logger.log(`Remediated legacy role for ${user.email}: ${roleName} -> ${roleEntity._id}`);
      }
    }
  }

  private async seedAirports() {
    const count = await this.airportModel.countDocuments().exec();
    if (count > 0) return;

    const airports = [
      {
        code: "LOS",
        name: "Murtala Muhammed International Airport",
        city: "Lagos",
        country: "Nigeria",
        lat: 6.5774,
        lng: 3.3214,
        timezone: "Africa/Lagos",
      },
      {
        code: "ABV",
        name: "Nnamdi Azikiwe International Airport",
        city: "Abuja",
        country: "Nigeria",
        lat: 9.0069,
        lng: 7.2632,
        timezone: "Africa/Lagos",
      },
      {
        code: "LHR",
        name: "London Heathrow Airport",
        city: "London",
        country: "United Kingdom",
        lat: 51.47,
        lng: -0.4543,
        timezone: "Europe/London",
      },
      {
        code: "JFK",
        name: "John F. Kennedy International Airport",
        city: "New York",
        country: "United States",
        lat: 40.6413,
        lng: -73.7781,
        timezone: "America/New_York",
      },
      {
        code: "DXB",
        name: "Dubai International Airport",
        city: "Dubai",
        country: "UAE",
        lat: 25.2528,
        lng: 55.3644,
        timezone: "Asia/Dubai",
      },
      {
        code: "CDG",
        name: "Charles de Gaulle Airport",
        city: "Paris",
        country: "France",
        lat: 49.0097,
        lng: 2.5479,
        timezone: "Europe/Paris",
      },
      {
        code: "AMS",
        name: "Amsterdam Schiphol Airport",
        city: "Amsterdam",
        country: "Netherlands",
        lat: 52.3105,
        lng: 4.7683,
        timezone: "Europe/Amsterdam",
      },
      {
        code: "FRA",
        name: "Frankfurt Airport",
        city: "Frankfurt",
        country: "Germany",
        lat: 50.0379,
        lng: 8.5622,
        timezone: "Europe/Berlin",
      },
      {
        code: "SIN",
        name: "Singapore Changi Airport",
        city: "Singapore",
        country: "Singapore",
        lat: 1.3644,
        lng: 103.9915,
        timezone: "Asia/Singapore",
      },
      {
        code: "NBO",
        name: "Jomo Kenyatta International Airport",
        city: "Nairobi",
        country: "Kenya",
        lat: -1.3192,
        lng: 36.9278,
        timezone: "Africa/Nairobi",
      },
      {
        code: "ACC",
        name: "Kotoka International Airport",
        city: "Accra",
        country: "Ghana",
        lat: 5.6052,
        lng: -0.1668,
        timezone: "Africa/Accra",
      },
      {
        code: "CPT",
        name: "Cape Town International Airport",
        city: "Cape Town",
        country: "South Africa",
        lat: -33.9649,
        lng: 18.6017,
        timezone: "Africa/Johannesburg",
      },
      {
        code: "JNB",
        name: "O.R. Tambo International Airport",
        city: "Johannesburg",
        country: "South Africa",
        lat: -26.1392,
        lng: 28.246,
        timezone: "Africa/Johannesburg",
      },
      {
        code: "CAI",
        name: "Cairo International Airport",
        city: "Cairo",
        country: "Egypt",
        lat: 30.1219,
        lng: 31.4056,
        timezone: "Africa/Cairo",
      },
      {
        code: "IST",
        name: "Istanbul Airport",
        city: "Istanbul",
        country: "Turkey",
        lat: 41.2753,
        lng: 28.7519,
        timezone: "Europe/Istanbul",
      },
      {
        code: "ADD",
        name: "Bole International Airport",
        city: "Addis Ababa",
        country: "Ethiopia",
        lat: 8.9779,
        lng: 38.7993,
        timezone: "Africa/Addis_Ababa",
      },
      {
        code: "LAX",
        name: "Los Angeles International Airport",
        city: "Los Angeles",
        country: "United States",
        lat: 33.9425,
        lng: -118.4081,
        timezone: "America/Los_Angeles",
      },
      {
        code: "ORD",
        name: "O'Hare International Airport",
        city: "Chicago",
        country: "United States",
        lat: 41.9742,
        lng: -87.9073,
        timezone: "America/Chicago",
      },
      {
        code: "HND",
        name: "Haneda Airport",
        city: "Tokyo",
        country: "Japan",
        lat: 35.5494,
        lng: 139.7798,
        timezone: "Asia/Tokyo",
      },
      {
        code: "PEK",
        name: "Beijing Capital International Airport",
        city: "Beijing",
        country: "China",
        lat: 40.0799,
        lng: 116.6031,
        timezone: "Asia/Shanghai",
      },
      {
        code: "BOM",
        name: "Chhatrapati Shivaji Maharaj International Airport",
        city: "Mumbai",
        country: "India",
        lat: 19.0896,
        lng: 72.8656,
        timezone: "Asia/Kolkata",
      },
      {
        code: "PHC",
        name: "Port Harcourt International Airport",
        city: "Port Harcourt",
        country: "Nigeria",
        lat: 5.0151,
        lng: 6.9496,
        timezone: "Africa/Lagos",
      },
      {
        code: "KAN",
        name: "Mallam Aminu Kano International Airport",
        city: "Kano",
        country: "Nigeria",
        lat: 12.0476,
        lng: 8.5247,
        timezone: "Africa/Lagos",
      },
      {
        code: "ENU",
        name: "Akanu Ibiam International Airport",
        city: "Enugu",
        country: "Nigeria",
        lat: 6.4743,
        lng: 7.562,
        timezone: "Africa/Lagos",
      },
      {
        code: "ATL",
        name: "Hartsfield-Jackson Atlanta International Airport",
        city: "Atlanta",
        country: "United States",
        lat: 33.6407,
        lng: -84.4277,
        timezone: "America/New_York",
      },
    ];

    await this.airportModel.insertMany(airports);
    this.logger.log(`Seeded ${airports.length} airports`);
  }

  private async seedAirlines() {
    const count = await this.airlineModel.countDocuments().exec();
    if (count > 0) return;

    const airlines = [
      { code: "W3", name: "Arik Air", country: "Nigeria", isActive: true },
      { code: "P4", name: "Air Peace", country: "Nigeria", isActive: true },
      { code: "VK", name: "Value Jet", country: "Nigeria", isActive: true },
      {
        code: "QR",
        name: "Green Africa Airways",
        country: "Nigeria",
        isActive: true,
      },
      {
        code: "ET",
        name: "Ethiopian Airlines",
        country: "Ethiopia",
        isActive: true,
      },
      { code: "KQ", name: "Kenya Airways", country: "Kenya", isActive: true },
      {
        code: "SA",
        name: "South African Airways",
        country: "South Africa",
        isActive: true,
      },
      { code: "MS", name: "EgyptAir", country: "Egypt", isActive: true },
      {
        code: "AT",
        name: "Royal Air Maroc",
        country: "Morocco",
        isActive: true,
      },
      {
        code: "BA",
        name: "British Airways",
        country: "United Kingdom",
        isActive: true,
      },
      { code: "EK", name: "Emirates", country: "UAE", isActive: true },
      { code: "QR2", name: "Qatar Airways", country: "Qatar", isActive: true },
      {
        code: "TK",
        name: "Turkish Airlines",
        country: "Turkey",
        isActive: true,
      },
      {
        code: "KL",
        name: "KLM Royal Dutch Airlines",
        country: "Netherlands",
        isActive: true,
      },
      { code: "AF", name: "Air France", country: "France", isActive: true },
      { code: "LH", name: "Lufthansa", country: "Germany", isActive: true },
      {
        code: "AA",
        name: "American Airlines",
        country: "United States",
        isActive: true,
      },
      {
        code: "DL",
        name: "Delta Air Lines",
        country: "United States",
        isActive: true,
      },
      {
        code: "UA",
        name: "United Airlines",
        country: "United States",
        isActive: true,
      },
      {
        code: "SQ",
        name: "Singapore Airlines",
        country: "Singapore",
        isActive: true,
      },
    ];

    await this.airlineModel.insertMany(airlines);
    this.logger.log(`Seeded ${airlines.length} airlines`);
  }
  private async seedBankAccounts() {
    const count = await this.bankAccountModel.countDocuments().exec();
    if (count > 0) return;

    const accounts = [
      {
        bankName: "Access Bank",
        accountNumber: "1810000001",
        accountName: "FLYBETH TRAVELS LIMITED",
        beneficiaryName: "Flybeth Travels",
        currency: "NGN",
        isActive: true,
        logo: "https://companieslogo.com/img/orig/ACCESS.LG-38c3664d.png",
      },
      {
        bankName: "GTBank",
        accountNumber: "1810000002",
        accountName: "FLYBETH COLLECTIONS",
        beneficiaryName: "Flybeth Collections",
        currency: "NGN",
        isActive: true,
        logo: "https://vantagepay.io/wp-content/uploads/2022/01/GTBank-Logo.png",
      },
      {
        bankName: "Wema Bank",
        accountNumber: "1810000003",
        accountName: "FLYBETH COLLECTIONS",
        beneficiaryName: "Flybeth Collections",
        currency: "NGN",
        isActive: true,
        logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/Wema_Bank_Logo.png",
      },
      {
        bankName: "Chase Bank",
        accountNumber: "8810000001",
        accountName: "FLYBETH GLOBAL USD",
        beneficiaryName: "Flybeth Global",
        currency: "USD",
        isActive: true,
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/JPMorgan_Chase_Logo_2008.svg/2560px-JPMorgan_Chase_Logo_2008.svg.png",
      },
    ];

    await this.bankAccountModel.insertMany(accounts);
    this.logger.log(`Seeded ${accounts.length} bank accounts`);
  }

  private async seedAgentUser() {
    const existingAgent = await this.userModel
      .findOne({ email: "agent@flybeth.com" })
      .exec();
    if (existingAgent) return;

    const agentRole = await this.roleModel.findOne({ name: Role.AGENT }).exec();
    const hashedPassword = await hashPassword("Agent@2026!");

    const agent = new this.userModel({
      email: "agent@flybeth.com",
      password: hashedPassword,
      firstName: "Flybeth",
      lastName: "Agent",
      phone: "+2348000000000",
      role: agentRole?._id,
      isVerified: true,
      isActive: true,
      firstLogin: false,
      preferences: {
        currency: "NGN",
        language: "en",
        emailNotifications: true,
        pushNotifications: true,
      },
    });

    await agent.save();
    this.logger.log("Seeded default agent user: agent@flybeth.com");
  }

  private async seedAdminUser() {
    const email = "abahmarquis@gmail.com";
    const existingAdmin = await this.userModel.findOne({ email }).exec();
    
    if (existingAdmin) {
      this.logger.log(`Admin user ${email} already exists. Updating password.`);
      const hashedPassword = await hashPassword("Admin@123");
      await this.userModel.updateOne({ _id: existingAdmin._id }, { password: hashedPassword });
      return;
    }

    const adminRole = await this.roleModel.findOne({ name: Role.SUPER_ADMIN }).exec();
    const hashedPassword = await hashPassword("Admin@123");

    const admin = new this.userModel({
      email,
      password: hashedPassword,
      firstName: "Abah",
      lastName: "Marquis",
      phone: "+2348000000001",
      role: adminRole?._id,
      isVerified: true,
      isActive: true,
      firstLogin: false,
      preferences: {
        currency: "NGN",
        language: "en",
        emailNotifications: true,
        pushNotifications: true,
      },
    });

    await admin.save();
    this.logger.log(`Seeded default admin user: ${email}`);
  }

  private async seedCustomerUser() {
    const existingUser = await this.userModel
      .findOne({ email: "user@flybeth.com" })
      .exec();
    if (existingUser) return;

    const customerRole = await this.roleModel.findOne({ name: Role.CUSTOMER }).exec();
    const hashedPassword = await hashPassword("User@2026!");

    const user = new this.userModel({
      email: "user@flybeth.com",
      password: hashedPassword,
      firstName: "Flybeth",
      lastName: "User",
      phone: "+2348000000002",
      role: customerRole?._id,
      isVerified: true,
      isActive: true,
      firstLogin: false,
      preferences: {
        currency: "NGN",
        language: "en",
        emailNotifications: true,
        pushNotifications: true,
      },
    });

    await user.save();
    this.logger.log("Seeded default customer user: user@flybeth.com");
  }
}
