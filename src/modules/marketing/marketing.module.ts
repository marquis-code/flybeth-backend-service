import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { MarketingCampaign, MarketingCampaignSchema } from './schemas/campaign.schema';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PassengersModule } from '../passengers/passengers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MarketingCampaign.name, schema: MarketingCampaignSchema }]),
    UsersModule,
    NotificationsModule,
    PassengersModule,
  ],
  controllers: [MarketingController],
  providers: [MarketingService],
})
export class MarketingModule {}
