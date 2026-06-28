import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { OrderFulfillmentService } from './src/modules/bookings/order-fulfillment.service';
import { getModelToken } from '@nestjs/mongoose';
import { Booking } from './src/modules/bookings/schemas/booking.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const fulfillment = app.get(OrderFulfillmentService);
  const bookingModel = app.get(getModelToken(Booking.name));
  
  console.log("Resetting status of 6a25f8924f99e6cf9082f240 to pending...");
  await bookingModel.findByIdAndUpdate('6a25f8924f99e6cf9082f240', { status: 'pending' });

  console.log("Fulfilling booking 6a25f8924f99e6cf9082f240...");
  try {
    const res = await fulfillment.finalizeTravelBooking('6a25f8924f99e6cf9082f240');
    console.log("Result:", res);
  } catch (err) {
    console.error("Error:", err.message);
  }

  await app.close();
}
bootstrap();
