import { Injectable, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { FlightsIntegrationService } from '../integrations/flights-integration.service';
import { StaysIntegrationService } from '../integrations/stays-integration.service';
import { PassengersService } from '../passengers/passengers.service';
import { BookingStatus, PaymentStatus } from '../../common/constants/roles.constant';

@Injectable()
export class OrderFulfillmentService {
  private readonly logger = new Logger(OrderFulfillmentService.name);

  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly flightsIntegrationService: FlightsIntegrationService,
    private readonly staysIntegrationService: StaysIntegrationService,
    private readonly passengersService: PassengersService,
  ) {}

  async finalizeTravelBooking(gatewayReference: string) {
    // Start an ACID transaction session for local DB updates
    const session = await this.connection.startSession();
    session.startTransaction();

    let booking: BookingDocument | null = null;
    try {
      // Find booking by payment reference (stored in payment metadata or providerReference)
      // Since we might not have a direct link in Booking schema yet, we'll search by payment if needed
      // But for this implementation, we'll assume we can find the booking related to this reference
      
      // We'll look for a booking where payment.transactionId matches gatewayReference
      // OR we might need to query the Payment model first.
      // For simplicity in this generic service, we'll assume the caller passes the bookingId or we find it.
      
      // Let's assume the caller found the booking and passed it, or we find it here.
      // (Adjustment: we'll use a search by providerReference if possible)
      
      booking = await this.bookingModel.findOne({ 
        "payment.transactionId": gatewayReference 
      }).session(session);

      if (!booking) {
        // Try searching by remoteOrderId
        booking = await this.bookingModel.findOne({ 
          remoteOrderId: gatewayReference 
        }).session(session);
      }

      if (!booking) {
        throw new BadRequestException('Booking reference not matched');
      }

      if (booking.status === BookingStatus.TICKETED || booking.status === BookingStatus.CONFIRMED) {
        return { message: 'Already processed' }; 
      }

      // Update native payment states safely
      booking.status = BookingStatus.CONFIRMED;
      booking.payment.status = PaymentStatus.SUCCESS;
      booking.payment.paidAt = new Date();
      await booking.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Local fulfillment transaction failed: ${error.message}`);
      throw new InternalServerErrorException(`Local Database Update Failed: ${error.message}`);
    } finally {
      await session.endSession();
    }

    // --- EXECUTE THIRD-PARTY BOOKINGS POST-PAYMENT VALIDATION ---
    try {
      let supplierReference = '';

      // 1. Handle Flights
      if (booking.flights?.length > 0) {
        const flight = booking.flights[0];
        if (flight.provider && flight.offerId) {
          const passengers = await this.passengersService.findByIds(
            flight.passengers.map(p => p.toString())
          );
          
          const bookingResult = await this.flightsIntegrationService.bookFlight(
            flight.offerId,
            flight.provider,
            passengers,
            { type: 'balance', amount: booking.pricing.totalAmount, currency: booking.pricing.currency }
          );
          
          supplierReference = (bookingResult as any).id || bookingResult.pnr || bookingResult.orderId;
        }
      }

      // 2. Handle Stays (Hotelbeds / Duffel Stays)
      if (booking.stays?.length > 0) {
        const stay = booking.stays[0];
        if (stay.stay && stay.room && (stay as any).provider) {
           const guestDetails = {
             firstName: booking.contactDetails.name.split(' ')[0],
             lastName: booking.contactDetails.name.split(' ').slice(1).join(' ') || 'Guest',
             email: booking.contactDetails.email,
             phone: booking.contactDetails.phone
           };
           
           const stayResult = await this.staysIntegrationService.createBooking(
             (stay as any).quoteId || stay.room.toString(),
             guestDetails,
             (stay as any).provider
           );
           
           supplierReference = (stayResult as any).id || stayResult.reference || supplierReference;
        }
      }

      // Update booking with provider transaction codes
      await this.bookingModel.findByIdAndUpdate(booking._id, {
        $set: { 
          remoteOrderId: supplierReference || booking.remoteOrderId,
          status: BookingStatus.TICKETED,
        }
      });

      this.logger.log(`Fulfillment completed for booking ${booking.pnr}. Supplier Ref: ${supplierReference}`);
      return { success: true, supplierReference };
    } catch (apiError) {
      this.logger.error(`Supplier fulfillment failed for ${booking.pnr}: ${apiError.message}`);
      // If payment was completed but GDS fulfillment failed, flag for manual intervention
      await this.bookingModel.findByIdAndUpdate(booking._id, {
        $set: { 
          status: BookingStatus.CONFIRMED, // At least confirmed locally
          notes: (booking.notes || '') + `\nFULFILLMENT_ERROR: ${apiError.message}`
        }
      });
      throw new InternalServerErrorException(`Supplier fulfillment failed: ${apiError.message}`);
    }
  }
}
