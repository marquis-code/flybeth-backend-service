import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MarketingService } from './src/modules/marketing/marketing.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const marketingService = app.get(MarketingService);
  
  const campaigns = await marketingService['campaignModel'].find({}).sort({ createdAt: -1 }).limit(5).exec();
  
  console.log("Recent campaigns processing status:");
  campaigns.forEach(c => {
    console.log(`- ${c.title} | Status: ${c.status} | Recipients: ${c.recipientCount} | Target: ${c.filters?.target}`);
  });
  
  process.exit(0);
}
bootstrap();
