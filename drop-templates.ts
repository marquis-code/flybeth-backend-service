import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MarketingService } from './src/modules/marketing/marketing.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const marketingService = app.get(MarketingService);
  
  console.log("Deleting old templates...");
  await marketingService['campaignModel'].deleteMany({ isTemplate: true }).exec();
  
  console.log("Templates drop completed.");
  process.exit(0);
}
bootstrap();
