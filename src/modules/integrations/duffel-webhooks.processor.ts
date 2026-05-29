import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Booking, BookingDocument } from "../bookings/schemas/booking.schema";
import { NotificationsService } from "../notifications/notifications.service";
import { BookingStatus, PaymentStatus } from "../../common/constants/roles.constant";

@Processor("duffel-webhooks-queue")
export class DuffelWebhooksProcessor {
  private readonly logger = new Logger(DuffelWebhooksProcessor.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process("process-duffel-event")
  async handleDuffelEvent(job: Job) {
    const { eventType, payload, receivedAt } = job.data;
    
    this.logger.log(`Processing Duffel event: ${eventType} (Job ID: ${job.id})`);

    try {
      switch (eventType) {
        // FLIGHT EVENTS
        case "order.created":
          await this.handleFlightOrderCreated(payload);
          break;
        case "order.creation_failed":
          await this.handleFlightOrderCreationFailed(payload);
          break;
        case "order.airline_initiated_change_detected":
          await this.handleFlightOrderChanged(payload);
          break;
        case "order.cancellation.confirmed":
          await this.handleFlightOrderCancelled(payload);
          break;
          
        // STAYS (HOTELS) EVENTS
        case "stays.booking.created":
          await this.handleStaysBookingCreated(payload);
          break;
        case "stays.booking_creation_failed":
          await this.handleStaysBookingCreationFailed(payload);
          break;
        case "stays.booking.cancelled":
          await this.handleStaysBookingCancelled(payload);
          break;

        // CARS EVENTS
        case "cars.booking.created":
          await this.handleCarsBookingCreated(payload);
          break;
        case "cars.booking.cancelled":
          await this.handleCarsBookingCancelled(payload);
          break;

        // PAYMENTS
        case "air.payment.succeeded":
          await this.handlePaymentSucceeded(payload);
          break;
        case "air.payment.failed":
          await this.handlePaymentFailed(payload);
          break;

        default:
          this.logger.log(`Unhandled event type: ${eventType}. Ignoring.`);
      }
    } catch (error) {
      this.logger.error(`Error processing Duffel event ${eventType}:`, error);
      throw error; // Throwing error will cause BullMQ to retry the job
    }
  }

  private async handleFlightOrderCreated(payload: any) {
    const orderId = payload.data?.id;
    this.logger.log(`Handling Flight Order Created: ${orderId}`);
    
    const booking = await this.bookingModel.findOneAndUpdate(
      { remoteOrderId: orderId },
      { status: BookingStatus.CONFIRMED },
      { new: true }
    ).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Your Flight Booking is Confirmed! (${booking.pnr})`,
           `<p>Great news! Your flight booking <b>${booking.pnr}</b> has been confirmed by the airline.</p>`
         );
      }
    }
  }

  private async handleFlightOrderCreationFailed(payload: any) {
    const orderId = payload.data?.id;
    this.logger.log(`Handling Flight Order Creation Failed: ${orderId}`);
    
    const booking = await this.bookingModel.findOneAndUpdate(
      { remoteOrderId: orderId },
      { status: BookingStatus.CANCELLED },
      { new: true }
    ).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Urgent: Issue with your Flight Booking (${booking.pnr})`,
           `<p>Unfortunately, your flight booking <b>${booking.pnr}</b> could not be confirmed by the airline. Please contact support.</p>`
         );
      }
    }
  }

  private async handleFlightOrderChanged(payload: any) {
    const orderId = payload.data?.id;
    this.logger.log(`Handling Flight Order Airline Initiated Change: ${orderId}`);
    
    const booking = await this.bookingModel.findOne({ remoteOrderId: orderId }).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Important: Schedule Change for your Flight (${booking.pnr})`,
           `<p>The airline has initiated a schedule change for your booking <b>${booking.pnr}</b>. Please review your itinerary.</p>`
         );
      }
    }
  }

  private async handleFlightOrderCancelled(payload: any) {
    const orderId = payload.data?.id;
    this.logger.log(`Handling Flight Order Cancelled: ${orderId}`);
    
    const booking = await this.bookingModel.findOneAndUpdate(
      { remoteOrderId: orderId },
      { status: BookingStatus.CANCELLED },
      { new: true }
    ).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Your Flight Booking is Cancelled (${booking.pnr})`,
           `<p>Your flight booking <b>${booking.pnr}</b> has been successfully cancelled.</p>`
         );
      }
    }
  }

  private async handleStaysBookingCreated(payload: any) {
    const bookingId = payload.data?.id;
    this.logger.log(`Handling Stays Booking Created: ${bookingId}`);
    
    const booking = await this.bookingModel.findOneAndUpdate(
      { remoteOrderId: bookingId },
      { status: BookingStatus.CONFIRMED },
      { new: true }
    ).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Your Hotel Booking is Confirmed! (${booking.pnr})`,
           `<p>Great news! Your hotel booking <b>${booking.pnr}</b> has been confirmed.</p>`
         );
      }
    }
  }

  private async handleStaysBookingCreationFailed(payload: any) {
    const bookingId = payload.data?.id;
    this.logger.log(`Handling Stays Booking Creation Failed: ${bookingId}`);
    
    const booking = await this.bookingModel.findOneAndUpdate(
      { remoteOrderId: bookingId },
      { status: BookingStatus.CANCELLED },
      { new: true }
    ).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Urgent: Issue with your Hotel Booking (${booking.pnr})`,
           `<p>Unfortunately, your hotel booking <b>${booking.pnr}</b> could not be confirmed. Please contact support.</p>`
         );
      }
    }
  }

  private async handleStaysBookingCancelled(payload: any) {
    const bookingId = payload.data?.id;
    this.logger.log(`Handling Stays Booking Cancelled: ${bookingId}`);
    
    const booking = await this.bookingModel.findOneAndUpdate(
      { remoteOrderId: bookingId },
      { status: BookingStatus.CANCELLED },
      { new: true }
    ).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Your Hotel Booking is Cancelled (${booking.pnr})`,
           `<p>Your hotel booking <b>${booking.pnr}</b> has been successfully cancelled.</p>`
         );
      }
    }
  }

  private async handleCarsBookingCreated(payload: any) {
    const bookingId = payload.data?.id;
    this.logger.log(`Handling Cars Booking Created: ${bookingId}`);
    
    const booking = await this.bookingModel.findOneAndUpdate(
      { remoteOrderId: bookingId },
      { status: BookingStatus.CONFIRMED },
      { new: true }
    ).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Your Car Rental is Confirmed! (${booking.pnr})`,
           `<p>Great news! Your car rental booking <b>${booking.pnr}</b> has been confirmed.</p>`
         );
      }
    }
  }

  private async handleCarsBookingCancelled(payload: any) {
    const bookingId = payload.data?.id;
    this.logger.log(`Handling Cars Booking Cancelled: ${bookingId}`);
    
    const booking = await this.bookingModel.findOneAndUpdate(
      { remoteOrderId: bookingId },
      { status: BookingStatus.CANCELLED },
      { new: true }
    ).populate('user').exec();

    if (booking) {
      const email = (booking.user as any)?.email || booking.contactDetails?.email;
      if (email) {
         await this.notificationsService.sendEmail(
           email,
           `Your Car Rental is Cancelled (${booking.pnr})`,
           `<p>Your car rental booking <b>${booking.pnr}</b> has been successfully cancelled.</p>`
         );
      }
    }
  }

  private async handlePaymentSucceeded(payload: any) {
    const paymentId = payload.data?.id;
    this.logger.log(`Handling Payment Succeeded: ${paymentId}`);
    const orderId = payload.data?.order_id;
    if (orderId) {
      await this.bookingModel.findOneAndUpdate(
        { remoteOrderId: orderId },
        { 
          "payment.status": PaymentStatus.SUCCESS,
          "payment.paidAt": new Date(),
          "payment.transactionId": paymentId
        }
      ).exec();
    }
  }

  private async handlePaymentFailed(payload: any) {
    const paymentId = payload.data?.id;
    this.logger.log(`Handling Payment Failed: ${paymentId}`);
    
    const orderId = payload.data?.order_id;
    if (orderId) {
      await this.bookingModel.findOneAndUpdate(
        { remoteOrderId: orderId },
        { 
          "payment.status": PaymentStatus.FAILED,
          "payment.transactionId": paymentId
        }
      ).exec();
    }
  }
}
