import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';
import { RoleEntity, RoleSchema } from './schemas/role.schema';
import { PermissionEntity, PermissionSchema } from './schemas/permission.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoleEntity.name, schema: RoleSchema },
      { name: PermissionEntity.name, schema: PermissionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
