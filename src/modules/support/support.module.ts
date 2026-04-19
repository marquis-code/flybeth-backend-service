import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { NewsletterSubscription, NewsletterSubscriptionSchema } from './schemas/newsletter.schema';
import { ContactInquiry, ContactInquirySchema } from './schemas/inquiry.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsletterSubscription.name, schema: NewsletterSubscriptionSchema },
      { name: ContactInquiry.name, schema: ContactInquirySchema },
    ]),
    NotificationsModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
