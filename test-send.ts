import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MarketingService } from './src/modules/marketing/marketing.service';

async function bootstrap() {
  console.log("Initializing Nest...");
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log("App initialized.");
  
  const marketingService = app.get(MarketingService);
  
  console.log("Fetching campaigns...");
  const campaigns = await marketingService['campaignModel'].find({}).sort({ createdAt: -1 }).limit(1).exec();
  
  if (campaigns.length === 0) {
    console.log("No campaigns found in DB.");
    process.exit(0);
  }
  
  const latest = campaigns[0];
  console.log(`Testing campaign: ${latest._id} - ${latest.title}`);
  
  try {
    await marketingService.sendCampaign(latest._id.toString());
    console.log("Successfully ran sendCampaign method.");
  } catch (error) {
    console.error("sendCampaign failed:", error);
  }
  
  console.log("Reloading campaign...");
  const updated = await marketingService['campaignModel'].findById(latest._id).exec();
  console.log("Final status:", (updated as any).status, "Recipients:", (updated as any).recipientCount);
  
  process.exit(0);
}
bootstrap();
