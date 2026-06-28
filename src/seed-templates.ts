import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotificationsService } from './modules/notifications/notifications.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);
  await notificationsService.seedDefaultTemplates();
  console.log('Seed completed successfully.');
  await app.close();
}
bootstrap();
