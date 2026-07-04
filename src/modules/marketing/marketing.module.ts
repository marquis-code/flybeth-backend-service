import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { MarketingCampaign, MarketingCampaignSchema } from './schemas/campaign.schema';
import { Subscriber, SubscriberSchema } from './schemas/subscriber.schema';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PassengersModule } from '../passengers/passengers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketingCampaign.name, schema: MarketingCampaignSchema },
      { name: Subscriber.name, schema: SubscriberSchema },
    ]),
    UsersModule,
    NotificationsModule,
    PassengersModule,
  ],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
