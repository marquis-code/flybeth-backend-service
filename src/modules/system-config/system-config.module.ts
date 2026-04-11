import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { SystemConfig, SystemConfigSchema } from './schemas/system-config.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: SystemConfig.name, schema: SystemConfigSchema }]),
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
