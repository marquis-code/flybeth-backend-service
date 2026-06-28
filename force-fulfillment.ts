import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { OrderFulfillmentService } from './src/modules/bookings/order-fulfillment.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const fulfillment = app.get(OrderFulfillmentService);
  
  console.log("Fulfilling booking 6a25f8924f99e6cf9082f240...");
  try {
    const res = await fulfillment.finalizeTravelBooking('6a25f8924f99e6cf9082f240');
    console.log("Result 1:", res);
  } catch (err) {
    console.error("Error 1:", err.message);
  }

  console.log("Fulfilling booking 6a25fad6b4eb6e5764636f63...");
  try {
    const res2 = await fulfillment.finalizeTravelBooking('6a25fad6b4eb6e5764636f63');
    console.log("Result 2:", res2);
  } catch (err) {
    console.error("Error 2:", err.message);
  }
  
  await app.close();
}
bootstrap();
