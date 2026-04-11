import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleEntity, RoleDocument } from './schemas/role.schema';
import { PermissionEntity, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class AccessControlService implements OnModuleInit {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    @InjectModel(RoleEntity.name) private roleModel: Model<RoleDocument>,
    @InjectModel(PermissionEntity.name) private permissionModel: Model<PermissionDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultData();
  }

  private async seedDefaultData() {
    const permissions = [
      // Sidebar matching permissions
      { name: 'View Dashboard', key: 'view_dashboard', category: 'Main', description: 'Access to platform overview metrics' },
      { name: 'Manage Agents', key: 'manage_agents', category: 'Main', description: 'Review and verify high-level agents' },
      { name: 'Manage Agencies', key: 'manage_tenants', category: 'Main', description: 'Orchestrate tenant/agency accounts' },
      { name: 'Manage Team', key: 'manage_team', category: 'Main', description: 'Administer internal staff and users' },
      { name: 'View Bookings', key: 'view_bookings', category: 'Operations', description: 'Monitor global booking ledger' },
      { name: 'Audit Revenue', key: 'audit_revenue', category: 'Operations', description: 'Financial oversight and reporting' },
      { name: 'File Management', key: 'manage_storage', category: 'Infrastructure', description: 'Access to cloud storage assets' },
      { name: 'Email Templates', key: 'manage_emails', category: 'Marketing', description: 'Design and edit notification templates' },
      { name: 'Campaign Logic', key: 'manage_campaigns', category: 'Marketing', description: 'Orchestrate marketing email blasts' },
      { name: 'Security Guard', key: 'manage_fraud', category: 'Infrastructure', description: 'Audit fraud and risk vectors' },
      { name: 'Access Control', key: 'manage_roles', category: 'Security', description: 'Edit roles and system permissions' },
      { name: 'Platform Settings', key: 'manage_settings', category: 'Security', description: 'Fine-tune core platform parameters' },
    ];

    for (const p of permissions) {
      await this.permissionModel.updateOne({ key: p.key }, { $set: p }, { upsert: true });
    }

    // Default Super Admin Role
    const allPermKeys = permissions.map(p => p.key);
    await this.roleModel.updateOne(
      { name: 'super_admin' },
      { 
        $set: { 
          name: 'super_admin', 
          description: 'Unrestricted master access to all platform architectures.',
          permissions: allPermKeys,
          isDefault: true 
        } 
      },
      { upsert: true }
    );
    
    this.logger.log('Access Control parameters synchronized with platform architecture.');
  }

  async findAllRoles() {
    return this.roleModel.find().exec();
  }

  async findRoleByName(name: string) {
    return this.roleModel.findOne({ name }).exec();
  }

  async findRoleById(id: string) {
    return this.roleModel.findById(id).exec();
  }

  async createRole(data: any) {
    return new this.roleModel(data).save();
  }

  async updateRole(id: string, data: any) {
    return this.roleModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteRole(id: string) {
    const role = await this.roleModel.findById(id);
    if (role?.isDefault) throw new Error("Cannot delete system protected roles.");
    return this.roleModel.findByIdAndDelete(id).exec();
  }

  async findAllPermissions() {
    return this.permissionModel.find().exec();
  }

  async createPermission(data: any) {
    return new this.permissionModel(data).save();
  }

  async deletePermission(id: string) {
    return this.permissionModel.findByIdAndDelete(id).exec();
  }
}
