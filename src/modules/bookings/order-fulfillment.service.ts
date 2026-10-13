import { Injectable, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { FlightsIntegrationService } from '../integrations/flights-integration.service';
import { StaysIntegrationService } from '../integrations/stays-integration.service';
import { TransfersIntegrationService } from '../integrations/transfers-integration.service';
import { ExperiencesIntegrationService } from '../integrations/experiences-integration.service';
import { InsuranceIntegrationService } from '../integrations/insurance-integration.service';
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
    private readonly transfersIntegrationService: TransfersIntegrationService,
    private readonly experiencesIntegrationService: ExperiencesIntegrationService,
    private readonly insuranceIntegrationService: InsuranceIntegrationService,
    private readonly passengersService: PassengersService,
  ) {}

  async finalizeTravelBooking(bookingId: string) {
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
      
      booking = await this.bookingModel.findById(bookingId).session(session);

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

      // 2. Handle Stays (external suppliers only — platform inventory is
      //    already reserved by the bookings service)
      if (booking.stays?.length > 0) {
        for (const stay of booking.stays) {
          const stayProvider = (stay as any).provider;
          if (!stayProvider || stayProvider === 'flybeth') continue;

          const guestDetails = {
            firstName: booking.contactDetails.name.split(' ')[0],
            lastName: booking.contactDetails.name.split(' ').slice(1).join(' ') || 'Guest',
            email: booking.contactDetails.email,
            phone: booking.contactDetails.phone,
          };

          const stayResult = await this.staysIntegrationService.createBooking(
            (stay as any).quoteId || (stay as any).supplierReference,
            guestDetails,
            stayProvider,
          );

          supplierReference =
            (stayResult as any).id ||
            (stayResult as any).reference ||
            supplierReference;
        }
      }

      // 3. Handle Transfers (external suppliers only)
      if ((booking as any).transfers?.length > 0) {
        for (const transfer of (booking as any).transfers) {
          if (!transfer.provider || transfer.provider === 'flybeth-transfers') {
            continue;
          }
          try {
            const result = await this.transfersIntegrationService.createOrder(
              transfer.offerId,
              transfer.provider,
              {
                firstName: booking.contactDetails.name.split(' ')[0],
                lastName: booking.contactDetails.name.split(' ').slice(1).join(' ') || 'Guest',
                email: booking.contactDetails.email,
                phone: booking.contactDetails.phone,
              },
            );
            transfer.reference =
              (result as any).confirmationNumber || (result as any).orderId;
          } catch (err) {
            this.logger.warn(
              `Transfer supplier sync failed for ${transfer.offerId}: ${err.message}`,
            );
          }
        }
      }

      // 4. Handle Activities (external suppliers only)
      if ((booking as any).experiences?.length > 0) {
        for (const experience of (booking as any).experiences) {
          if (!experience.provider || experience.provider === 'flybeth-activities') {
            continue;
          }
          try {
            const result = await this.experiencesIntegrationService.createBooking(
              {
                experienceId: experience.experienceId,
                provider: experience.provider,
                date: experience.activityDate,
              },
              experience.provider,
            );
            experience.reference = (result as any)?.reference;
          } catch (err) {
            this.logger.warn(
              `Activity supplier sync failed for ${experience.experienceId}: ${err.message}`,
            );
          }
        }
      }

      // Handle Insurance via XCover
      if (booking.hasInsurance) {
        this.logger.debug(`Booking has insurance, attempting to issue policy for booking: ${booking.pnr}`);
        
        try {
          // Construct insured persons list from passengers/contact
          const insuredPersons: { firstName: string; lastName: string; birthDate?: string }[] = [];
          if (booking.flights?.length > 0) {
            // Find all passengers
            const flight = booking.flights[0];
            const passengers = await this.passengersService.findByIds(
              flight.passengers.map(p => p.toString())
            );
            insuredPersons.push(...passengers.map(p => ({
              firstName: p.firstName,
              lastName: p.lastName,
              birthDate: p.dateOfBirth ? p.dateOfBirth.toISOString().split('T')[0] : undefined
            })));
          } else {
            // Fallback to contact details
            insuredPersons.push({
              firstName: booking.contactDetails.name.split(' ')[0],
              lastName: booking.contactDetails.name.split(' ').slice(1).join(' ') || 'Guest'
            });
          }

          const nameParts = booking.contactDetails.name.split(' ');
          
          const issueResult = await this.insuranceIntegrationService.issuePolicy('xcover', {
            partnerTransactionId: booking.pnr,
            policyStartDate: new Date().toISOString().split('T')[0], // Assuming start date is today, ideally should be trip start date
            currency: booking.pricing.currency,
            insured: insuredPersons,
            policyholder: {
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' ') || 'Guest',
              email: booking.contactDetails.email,
              phone: booking.contactDetails.phone,
              country: 'US', // Default or extract from booking if available
            }
          });

          if (issueResult.success) {
            booking.insuranceDetails = {
              policyId: issueResult.policyId || '',
              provider: 'xcover',
              status: issueResult.status || 'active',
              issuedAt: new Date(),
              partnerTransactionId: booking.pnr
            };
            this.logger.log(`Successfully issued insurance policy ${issueResult.policyId} for booking ${booking.pnr}`);
            
            // Re-save booking to store insurance details
            await booking.save();
          } else {
            this.logger.error(`Failed to issue insurance for booking ${booking.pnr}: ${issueResult.error}`);
            // Depending on business requirements, you might want to fail the whole booking or just log the error
          }
        } catch (insuranceError) {
          this.logger.error(`Exception while issuing insurance for booking ${booking.pnr}: ${insuranceError.message}`);
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
