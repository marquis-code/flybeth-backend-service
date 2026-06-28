// src/modules/bookings/bookings.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Booking, BookingDocument } from "./schemas/booking.schema";
import {
  CreateBookingDto,
  CancelBookingDto,
  BookingQueryDto,
} from "./dto/booking.dto";
import { FlightsService } from "../flights/flights.service";
import { TenantsService } from "../tenants/tenants.service";
import { StaysService } from "../stays/stays.service";
import { CarsService } from "../cars/cars.service";
import { CruisesService } from "../cruises/cruises.service";
import { PackagesService } from "../packages/packages.service";
import { NotificationsService } from "../notifications/notifications.service";
import { FraudService } from "../fraud/fraud.service";
import { SystemConfigService } from "../system-config/system-config.service";
import { ConfigService } from "@nestjs/config";
import { InvoiceService } from "./invoice.service";
import { WalletService } from "../finance/wallet.service";
import { FlightsIntegrationService } from "../integrations/flights-integration.service";
import { PassengersService } from "../passengers/passengers.service";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { paginate, PaginatedResult } from "../../common/utils/pagination.util";
import { generatePNR } from "../../common/utils/crypto.util";
import {
  BookingStatus,
  PaymentStatus,
} from "../../common/constants/roles.constant";

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private flightsService: FlightsService,
    private tenantsService: TenantsService,
    private staysService: StaysService,
    private carsService: CarsService,
    private cruisesService: CruisesService,
    private packagesService: PackagesService,
    private notificationsService: NotificationsService,
    private fraudService: FraudService,
    private configService: SystemConfigService,
    private nestConfigService: ConfigService,
    private invoiceService: InvoiceService,
    private walletService: WalletService,
    private integrationService: FlightsIntegrationService,
    private passengersService: PassengersService,
  ) {}

  async create(
    userId: string | undefined,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    // 0. Whitelist Check
    const config = await this.configService.getConfig();
    if (config.isWhitelistingEnabled) {
      const userState = createBookingDto.contactDetails.state;
      if (!userState || !config.whitelistedStates.includes(userState)) {
        throw new BadRequestException(`Bookings are currently restricted. We only accept bookings from: ${config.whitelistedStates.join(', ')}`);
      }
    }

    // Generate unique PNR
    let pnr = "";
    let pnrExists = true;
    while (pnrExists) {
      pnr = generatePNR();
      pnrExists = !!(await this.bookingModel.findOne({ pnr }).exec());
    }

    // 0.5. Process Passenger Details if provided
    const additionalPassengerIds: string[] = [];
    if (createBookingDto.passengerDetails?.length) {
       for (const pDetail of createBookingDto.passengerDetails) {
          const savedP = await this.passengersService.create(userId as any, {
            ...pDetail,
            type: 'adult', // Default for now
          });
          additionalPassengerIds.push(savedP._id.toString());
       }
    }

    let totalBaseFare = 0;
    let totalTaxes = 0;
    const bookingFlights: any[] = [];
    const bookingStays: any[] = [];
    const bookingCars: any[] = [];
    const bookingCruises: any[] = [];

    // 1. Process Flights
    if (createBookingDto.flights) {
      for (const flightDto of createBookingDto.flights) {
        let flightPrice = 0;
        let flightCurrency = 'USD';

        if (flightDto.provider && flightDto.provider !== 'manual') {
          // For external providers (Duffel, etc.), we trust the priced offer from the frontend
          // usually these are re-verified in the secondary hold/booking step
          flightPrice = createBookingDto.pricing?.baseFare || 0; // Fallback to provided pricing
          
          const currentFlightPassengerIds = [...(flightDto.passengerIds || []), ...additionalPassengerIds];
          
          bookingFlights.push({
            flight: flightDto.flightId, 
            class: flightDto.class,
            passengers: currentFlightPassengerIds.map(id => new Types.ObjectId(id)),
            offerId: flightDto.offerId,
            provider: flightDto.provider,
          });
          
          // Pricing for external is usually handled by the offer total, 
          // but we'll add to total if not using the summary pricing
          if (totalBaseFare === 0) {
            totalBaseFare = createBookingDto.pricing?.baseFare || 0;
            totalTaxes = createBookingDto.pricing?.taxes || 0;
          }
        } else {
          // Local database flight
          const flight = await this.flightsService.findById(flightDto.flightId);
          const flightClass = flight.classes?.find(
            (c) => c.type === flightDto.class,
          );

          if (!flightClass) {
            throw new BadRequestException(
              `Class ${flightDto.class} not available on flight ${flight.flightNumber}`,
            );
          }

          const currentFlightPassengerIds = [...(flightDto.passengerIds || []), ...additionalPassengerIds];

          if (flightClass.seatsAvailable < currentFlightPassengerIds.length) {
            throw new BadRequestException(
              `Not enough seats available on flight ${flight.flightNumber}. Requested ${currentFlightPassengerIds.length}, available ${flightClass.seatsAvailable}`,
            );
          }

          totalBaseFare += flightClass.basePrice * currentFlightPassengerIds.length;
          totalTaxes +=
            flightClass.basePrice * currentFlightPassengerIds.length * 0.12; // 12% flight tax

          bookingFlights.push({
            flight: flightDto.flightId,
            class: flightDto.class,
            passengers: currentFlightPassengerIds.map(
              (id) => new Types.ObjectId(id),
            ),
            offerId: flightDto.offerId,
            provider: flightDto.provider || 'manual',
          });

          // Reserve seats
          await this.flightsService.updateSeatAvailability(
            flightDto.flightId,
            flightDto.class,
            currentFlightPassengerIds.length,
          );
        }
      }
    }

    // 2. Process Stays
    if (createBookingDto.stays) {
      for (const stayDto of createBookingDto.stays) {
        const room = await this.staysService.getRoomById(stayDto.roomId);
        const checkIn = new Date(stayDto.checkIn);
        const checkOut = new Date(stayDto.checkOut);
        const nights = Math.max(
          1,
          Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );

        const stayPrice = room.pricePerNight * nights * stayDto.occupancy.rooms;
        totalBaseFare += stayPrice;
        totalTaxes += stayPrice * 0.1; // 10% hospitality tax

        bookingStays.push({
          stay: new Types.ObjectId(stayDto.hotelId),
          room: new Types.ObjectId(stayDto.roomId),
          checkIn,
          checkOut,
          occupancy: stayDto.occupancy,
        });

        // Reserve room
        await this.staysService.updateRoomAvailability(
          stayDto.roomId,
          stayDto.occupancy.rooms,
        );
      }
    }

    // 3. Process Cars
    if (createBookingDto.cars) {
      for (const carDto of createBookingDto.cars) {
        const car = await this.carsService.findById(carDto.carId);

        // For rental, price might be per day. For ride, it might be flat.
        const carPrice = car.pricing.baseRate;
        totalBaseFare += carPrice;
        totalTaxes += carPrice * 0.05; // 5% car tax

        bookingCars.push({
          car: new Types.ObjectId(carDto.carId),
          pickUpDate: new Date(carDto.pickUpDate),
          dropOffDate: new Date(carDto.dropOffDate),
          pickUpLocation: carDto.pickUpLocation,
          dropOffLocation: carDto.dropOffLocation,
        });
      }
    }

    // 4. Process Cruises
    if (createBookingDto.cruises) {
      for (const cruiseDto of createBookingDto.cruises) {
        const cruise = await this.cruisesService.findById(cruiseDto.cruiseId);
        const cabin = cruise.cabinClasses.find(
          (c) => c.type === cruiseDto.cabinType,
        );

        if (!cabin) {
          throw new BadRequestException(
            `Cabin type ${cruiseDto.cabinType} not available on cruise ${cruise.name}`,
          );
        }

        if (cabin.availability < cruiseDto.passengerIds.length) {
          throw new BadRequestException(
            `Not enough availability for cabin ${cruiseDto.cabinType} on cruise ${cruise.name}`,
          );
        }

        const cruisePrice = cabin.price * cruiseDto.passengerIds.length;
        totalBaseFare += cruisePrice;
        totalTaxes += cruisePrice * 0.08; // 8% cruise tax

        bookingCruises.push({
          cruise: new Types.ObjectId(cruiseDto.cruiseId),
          cabinType: cruiseDto.cabinType,
          departureDate: new Date(cruiseDto.departureDate),
          passengers: cruiseDto.passengerIds.map(
            (id) => new Types.ObjectId(id),
          ),
        });

        // Reserve cabins/spots
        await this.cruisesService.updateCabinAvailability(
          cruiseDto.cruiseId,
          cruiseDto.cabinType,
          cruiseDto.passengerIds.length,
        );
      }
    }

    // Apply Package Discount if applicable
    let discount = 0;
    if (createBookingDto.packageId) {
      const pkg = await this.packagesService.findById(
        createBookingDto.packageId,
      );
      // Apply the discount percentage defined in the package
      discount = totalBaseFare * (pkg.discountPercentage / 100);
    }

    // Calculate tenant markup
    let tenantMarkup = 0;
    if (createBookingDto.tenantId) {
      try {
        const tenant = await this.tenantsService.findById(
          createBookingDto.tenantId,
        );
        tenantMarkup =
          totalBaseFare * ((tenant.settings?.markupPercentage || 0) / 100);
      } catch {
        // No tenant markup if tenant not found
      }
    }

    const isB2C = !createBookingDto.tenantId && userId; // If no tenantId, it's direct consumer
    const isB2B = !!createBookingDto.tenantId;

    // Platform Commission (B2B or B2C)
    const platformCommissionPercent = isB2B ? config.b2bCommission : config.b2cCommission;
    const platformCommission = totalBaseFare * (platformCommissionPercent / 100);
    
    // Ancillary Margin for external flights
    let platformAncillaryMargin = 0;
    if (bookingFlights.some(f => f.provider && f.provider !== 'manual')) {
      platformAncillaryMargin = totalBaseFare * ((config.ancillaryMargin || 0) / 100);
    }

    // Hide platform commission and ancillary margin inside the base fare as requested
    totalBaseFare += platformCommission + platformAncillaryMargin;

    const totalPassengers =
      (bookingFlights.reduce(
        (sum, f) => sum + f.passengers.length,
        0,
      ) || 0) +
      (bookingStays.reduce(
        (sum, s) => sum + s.occupancy.adults + (s.occupancy.children || 0),
        0,
      ) || 0);

    const isBatchBooking = totalPassengers > 1;
    const batchLabel = isBatchBooking ? (createBookingDto.notes || `Team Trip: ${totalPassengers} pax`) : null;

    const agentServiceFee = createBookingDto.agentServiceFee || 0;
    const adultMarkup = createBookingDto.adultMarkup || 0;
    
    // Dynamic Ancillary pricing from config
    const hasInsurance = createBookingDto.hasInsurance || false;
    const insuranceAmount = hasInsurance ? (config.ancillaryPrices?.insurance || 25) * totalPassengers : 0;
    
    const hasVipSupport = createBookingDto.hasVipSupport || false;
    const vipSupportAmount = hasVipSupport ? (config.ancillaryPrices?.vipSupport || 15) : 0;
    
    const extraBaggageCount = createBookingDto.extraBaggageCount || 0;
    const baggageAmount = extraBaggageCount * (config.ancillaryPrices?.bags || 25);
    
    const premiumSeatCount = createBookingDto.premiumSeatCount || 0;
    const seatAmount = premiumSeatCount * (config.ancillaryPrices?.seats || 15);

    const totalAncillaries = insuranceAmount + vipSupportAmount + baggageAmount + seatAmount;

    const totalAmount = totalBaseFare + totalTaxes + tenantMarkup + agentServiceFee + (adultMarkup * (bookingFlights[0]?.passengers?.length || 1)) + totalAncillaries - discount;

    const booking = new this.bookingModel({
      pnr: pnr.toUpperCase(),
      user: userId ? new Types.ObjectId(userId) : null,
      tenant: createBookingDto.tenantId
        ? new Types.ObjectId(createBookingDto.tenantId)
        : null,
      package: createBookingDto.packageId
        ? new Types.ObjectId(createBookingDto.packageId)
        : null,
      flights: bookingFlights,
      stays: bookingStays,
      cars: bookingCars,
      cruises: bookingCruises,
      contactDetails: createBookingDto.contactDetails,
      pricing: {
        baseFare: totalBaseFare,
        taxes: totalTaxes,
        fees: 0,
        tenantMarkup,
        agentServiceFee,
        adultMarkup,
        insuranceAmount,
        vipSupportAmount,
        baggageAmount,
        seatAmount,
        platformCommission,
        platformAncillaryMargin,
        discount,
        totalAmount,
        currency: createBookingDto.currency || "USD",
      },
      payment: { 
        status: createBookingDto.paymentModel === 'on_hold' ? PaymentStatus.PENDING : PaymentStatus.PENDING 
      },
      status: createBookingDto.paymentModel === 'on_hold' ? BookingStatus.PENDING : BookingStatus.PENDING,
      paymentModel: createBookingDto.paymentModel || 'pay_now',
      hasInsurance,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
      totalPassengers,
      isRoundTrip: createBookingDto.isRoundTrip || false,
      notes: createBookingDto.notes,
      isBatchBooking,
      batchLabel,
      ipAddress: createBookingDto.ipAddress,
      deviceFingerprint: createBookingDto.deviceFingerprint,
      userAgent: createBookingDto.userAgent,
      termsAcceptedAt: new Date(),
    });

    const saved = await booking.save();
    
    // Aggressive real-time emission
    try {
      this.notificationsService.emitBookingAttempt(saved.toObject());
    } catch (e) {
      this.logger.warn("Failed to emit real-time booking attempt: " + e.message);
    }

     // 5. Handle Payment immediately if Wallet
      if (createBookingDto.paymentProvider === 'wallet') {
        if (!userId) {
          throw new BadRequestException('Wallet payment is only available for registered users');
        }
        try {
          const balance = await this.walletService.getBalance(userId);
          if (balance < totalAmount) {
            throw new BadRequestException('Insufficient wallet balance');
          }

          // Verify PIN if required (handled in payments service usually)
          await this.walletService.debit(userId, totalAmount, `Booking ${saved.pnr}`, saved._id.toString());
          
          // If it's a flight, book it immediately on Duffel
          if (saved.flights?.length) {
             const flight = saved.flights[0];
             if (flight.offerId && flight.provider) {
                 const currentFlight = saved.flights?.[0];
                 const passengers = await this.passengersService.findByIds(currentFlight?.passengers?.map(p => p.toString()) || []);
                await this.integrationService.bookFlight(
                  flight.offerId,
                  flight.provider,
                  passengers,
                  { type: 'balance', amount: totalAmount, currency: saved.pricing.currency }
                );
             }
          }

          // Update status to confirmed
          await this.bookingModel.findByIdAndUpdate(saved._id, {
            status: BookingStatus.TICKETED,
            "payment.status": PaymentStatus.SUCCESS,
            "payment.provider": "wallet",
            "payment.paidAt": new Date(),
          });
        } catch (err) {
          this.logger.error(`Wallet payment failed for booking ${saved.pnr}: ${err.message}`);
          // Status remains pending
        }
     } 
     // 5.1 Handle Payment immediately if Duffel
     else if (createBookingDto.paymentProvider === 'duffel' && createBookingDto.paymentModel === 'pay_now') {
        try {
          if (saved.flights?.length) {
            const flight = saved.flights[0];
            if (flight.offerId && flight.provider) {
              const currentFlight = saved.flights?.[0];
              const passengers = await this.passengersService.findByIds(currentFlight?.passengers?.map(p => p.toString()) || []);
              
              // We use Duffel Balance (Prepaid Funds) as the payment method for instant orders
              // as recommended in the Duffel documentation for seamless API booking without 3DS interruptions.
              await this.integrationService.bookFlight(
                flight.offerId,
                flight.provider,
                passengers,
                { type: 'balance', amount: saved.pricing.baseFare + saved.pricing.taxes, currency: saved.pricing.currency }
              );

              // Update status to confirmed ticket
              await this.bookingModel.findByIdAndUpdate(saved._id, {
                status: BookingStatus.TICKETED,
                "payment.status": PaymentStatus.SUCCESS,
                "payment.provider": "duffel",
                "payment.paidAt": new Date(),
              });
              
              this.notificationsService.emitBookingSuccess(saved.toObject());
              this.logger.log(`Duffel booking paid and ticketed for ${saved.pnr}`);
            }
          }
        } catch (err) {
          this.notificationsService.emitBookingFailed(saved.toObject());
          this.logger.error(`Duffel payment/booking failed for ${saved.pnr}: ${err.message}`);
          throw new BadRequestException(`Flight booking failed: ${err.message}`);
        }
     }
     // 5.1 Handle Hold Order Logic
     else if (createBookingDto.paymentModel === 'on_hold') {
       try {
         if (saved.flights?.length) {
           const flight = saved.flights[0];
           if (flight.offerId && flight.provider) {
              const currentFlight = booking.flights?.[0];
              const passengers = await this.passengersService.findByIds(currentFlight?.passengers?.map(p => p.toString()) || []);
              const holdResult = await this.integrationService.createHoldOrder(
                flight.provider,
                flight.offerId,
                passengers
              );
              
              // Update local booking with remote reference and expiry
              await this.bookingModel.findByIdAndUpdate(saved._id, {
                pnr: holdResult.pnr.toUpperCase(),
                remoteOrderId: holdResult.orderId,
                expiresAt: holdResult.expiresAt ? new Date(holdResult.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h if provider doesn't specify
                status: BookingStatus.PENDING,
              });
              this.logger.log(`Flight held successfully: ${holdResult.pnr} for booking ${saved.pnr}`);
           }
         }
       } catch (err) {
         this.logger.error(`Failed to create hold order for booking ${saved.pnr}: ${err.message}`);
         // We keep the local booking as is, it's just not synced with external provider yet
       }
     }

    const populated = await this.findById(saved._id.toString());

    // Send notifications
    this.sendAgentBookingNotifications(populated).catch(err => {
        this.logger.error(`Failed to send booking notifications for ${populated.pnr}: ${err.message}`);
    });

    // Calculate risk score asynchronously (but we'll wait or use a hook)
    this.fraudService.calculateRiskScore(saved._id.toString()).catch((err) => {
      this.logger.error(`Risk scoring failed for ${saved.pnr}: ${err.message}`);
    });

    this.logger.log(`Booking created: ${saved.pnr} for ${userId ? `user ${userId}` : 'guest'}`);

    return this.findById(saved._id.toString());
  }

  async findById(id: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate("user", "firstName lastName email phone")
      .populate("tenant", "name slug")
      .populate("flights.flight")
      .populate("flights.passengers")
      .populate("stays.stay")
      .populate("stays.room")
      .lean()
      .exec();

    if (!booking) throw new NotFoundException("Booking not found");
    return booking as unknown as BookingDocument;
  }

  async findByPNR(pnr: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findOne({ pnr: pnr.toUpperCase() })
      .populate("user", "firstName lastName email phone")
      .populate("tenant", "name slug")
      .populate("flights.flight")
      .populate("flights.passengers")
      .populate("stays.stay")
      .populate("stays.room")
      .lean()
      .exec();

    if (!booking) throw new NotFoundException("Booking not found");
    return booking as unknown as BookingDocument;
  }

  async findByPnrAndEmail(pnr: string, email: string, sendEmail?: boolean): Promise<BookingDocument> {
    const query = {
      pnr: pnr.trim().toUpperCase(),
      "contactDetails.email": { $regex: new RegExp(`^${email.trim()}$`, "i") },
    };

    const booking = await this.bookingModel
      .findOne(query)
      .populate("user", "firstName lastName email")
      .populate("flights.flight")
      .populate("flights.passengers")
      .populate("stays.stay")
      .populate("stays.room")
      .lean()
      .exec();

    if (!booking) {
      throw new NotFoundException("Booking not found for the provided details");
    }

    if (sendEmail) {
      this.notificationsService.sendBookingConfirmation({
        email: booking.contactDetails?.email,
        pnr: booking.pnr,
        firstName: (booking.user as any)?.firstName || booking.contactDetails?.name?.split(' ')[0] || 'Traveler',
        totalAmount: booking.pricing?.totalAmount || 0,
        currency: 'USD',
        flightDetails: booking.flights && booking.flights.length > 0
          ? booking.flights.map((f: any) => f.flight?.number || 'Flight').join(', ')
          : 'Booking Details',
      }).catch(err => {
        this.logger.error(`Failed to send manage booking email for PNR ${booking.pnr}`, err);
      });
    }

    return booking as unknown as BookingDocument;
  }

  async findUserBookings(
    user: any,
    paginationDto: PaginationDto,
    queryDto?: BookingQueryDto,
  ): Promise<PaginatedResult<BookingDocument>> {
    const query: any = { 
      $or: [
        { user: new Types.ObjectId(user._id) },
        { "contactDetails.email": user.email }
      ]
    };
    if (queryDto?.status) query.status = queryDto.status;
    if (queryDto?.startDate || queryDto?.endDate) {
      query.bookedAt = {};
      if (queryDto.startDate)
        query.bookedAt.$gte = new Date(queryDto.startDate);
      if (queryDto.endDate) query.bookedAt.$lte = new Date(queryDto.endDate);
    }

    return paginate(this.bookingModel, query, paginationDto, [
      "flights.flight",
      "flights.passengers",
      "stays.stay",
      "stays.room",
      "cars.car",
      "cruises.cruise",
      "cruises.passengers",
      { path: "tenant", select: "name slug" },
    ]);
  }

  async findTenantBookings(
    tenantId: string,
    paginationDto: PaginationDto,
    queryDto?: BookingQueryDto,
  ): Promise<PaginatedResult<BookingDocument>> {
    const query: any = { tenant: new Types.ObjectId(tenantId) };
    if (queryDto?.status) query.status = queryDto.status;
    if (queryDto?.startDate || queryDto?.endDate) {
      query.bookedAt = {};
      if (queryDto.startDate)
        query.bookedAt.$gte = new Date(queryDto.startDate);
      if (queryDto.endDate) query.bookedAt.$lte = new Date(queryDto.endDate);
    }

    return paginate(this.bookingModel, query, paginationDto, [
      "user",
      "flights.flight",
      "flights.passengers",
      "stays.stay",
      "stays.room",
      "cars.car",
      "cruises.cruise",
      "cruises.passengers",
    ]);
  }

  async payForHeldOrder(bookingId: string, paymentDto: any): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending/held bookings can be paid for');
    }
    
    if (!booking.remoteOrderId) {
      throw new BadRequestException('Booking does not have a remote order ID');
    }

    try {
      // Typically the flight provider is the one we hold through (e.g. Duffel)
      const provider = booking.flights?.[0]?.provider || 'duffel';
      
      const paymentOpts = {
        type: paymentDto?.type || 'balance',
        amount: booking.pricing.totalAmount,
        currency: booking.pricing.currency
      };

      const result = await this.integrationService.payForOrder(
        provider,
        booking.remoteOrderId,
        paymentOpts
      );

      if (!result.success) {
        throw new BadRequestException('Payment failed at the provider (price may have changed or payment rejected)');
      }

      const updated = await this.bookingModel.findByIdAndUpdate(bookingId, {
        status: BookingStatus.TICKETED,
        "payment.status": PaymentStatus.SUCCESS,
        "payment.provider": provider,
        "payment.paidAt": new Date(),
      }, { new: true }).exec();
      
      this.logger.log(`Held booking paid and ticketed: ${booking.pnr}`);
      return updated as BookingDocument;
      
    } catch (err) {
      this.logger.error(`Failed to pay for held booking ${booking.pnr}: ${err.message}`);
      throw new BadRequestException(`Payment failed: ${err.message}`);
    }
  }

  async handleWebhookEvent(event: any): Promise<void> {
    const { type, object } = event;
    
    if (!object || !object.id) {
      this.logger.warn(`Received webhook event without object or id: ${type}`);
      return;
    }

    try {
      const orderId = object.id; // remoteOrderId

      switch (type) {
        case 'order.created':
          await this.bookingModel.findOneAndUpdate(
            { remoteOrderId: orderId, status: { $ne: BookingStatus.TICKETED } },
            { status: BookingStatus.TICKETED, ticketedAt: new Date() }
          );
          this.logger.log(`Webhook: Order created for ${orderId}, updated to TICKETED.`);
          break;

        case 'order.creation_failed':
          await this.bookingModel.findOneAndUpdate(
            { remoteOrderId: orderId },
            { status: BookingStatus.FAILED, notes: 'Order creation failed at the airline' }
          );
          this.logger.warn(`Webhook: Order creation failed for ${orderId}.`);
          break;

        case 'order_cancellation.confirmed':
          await this.bookingModel.findOneAndUpdate(
            { remoteOrderId: orderId },
            { status: BookingStatus.CANCELLED }
          );
          this.logger.log(`Webhook: Order cancelled for ${orderId}.`);
          break;

        case 'order.airline_initiated_change_detected':
          this.logger.log(`Webhook: Airline initiated change for ${orderId}. Requires user notification.`);
          // Optionally send notification to user here
          break;

        default:
          this.logger.log(`Webhook: Unhandled event type ${type}`);
          break;
      }
    } catch (err) {
      this.logger.error(`Error processing webhook event ${type}: ${err.message}`);
    }
  }

  async confirmBooking(bookingId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findByIdAndUpdate(
        bookingId,
        {
          status: BookingStatus.CONFIRMED,
          "payment.status": PaymentStatus.SUCCESS,
          "payment.paidAt": new Date(),
        },
        { new: true },
      )
      .exec();

    if (!booking) throw new NotFoundException("Booking not found");

    // Update tenant stats
    if (booking.tenant) {
      await this.tenantsService.incrementBookingCount(
        booking.tenant.toString(),
        booking.pricing.totalAmount,
      );
    }

    this.logger.log(`Booking confirmed: ${booking.pnr}`);
    return booking;
  }

  async cancelBooking(
    id: string,
    userId: string,
    cancelDto: CancelBookingDto,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) throw new NotFoundException("Booking not found");

    if (!booking.user) {
      throw new BadRequestException("Guest bookings cannot be cancelled online. Please contact support.");
    }

    if (booking.user.toString() !== userId) {
      throw new BadRequestException("You can only cancel your own bookings");
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.REFUNDED
    ) {
      throw new BadRequestException("Booking is already cancelled");
    }

    // Calculate refund amount (80% if confirmed, 100% if pending)
    let refundAmount = 0;
    if (booking.payment.status === PaymentStatus.SUCCESS) {
      refundAmount = booking.pricing.totalAmount * 0.8; // 20% cancellation fee
    }

    // Restore seats
    for (const f of booking.flights) {
      await this.flightsService.restoreSeatAvailability(
        f.flight.toString(),
        f.class,
        f.passengers.length,
      );
    }

    // Restore rooms
    if (booking.stays) {
      for (const s of booking.stays) {
        await this.staysService.updateRoomAvailability(
          s.room.toString(),
          -s.occupancy.rooms,
        );
      }
    }

    const updated = await this.bookingModel
      .findByIdAndUpdate(
        id,
        {
          status: BookingStatus.CANCELLED,
          cancellation: {
            reason: cancelDto.reason,
            cancelledAt: new Date(),
            refundAmount,
            refundStatus: refundAmount > 0 ? "pending" : "processed",
          },
        },
        { new: true },
      )
      .exec();

    this.logger.log(`Booking cancelled: ${booking.pnr}`);
    return updated as BookingDocument;
  }

  async expireBookings(): Promise<number> {
    const result = await this.bookingModel
      .updateMany(
        {
          status: BookingStatus.PENDING,
          expiresAt: { $lte: new Date() },
        },
        {
          status: BookingStatus.EXPIRED,
        },
      )
      .exec();

    if (result.modifiedCount > 0) {
      this.logger.log(`Expired ${result.modifiedCount} bookings`);
    }
    return result.modifiedCount;
  }

  async findAbandonedBookings(): Promise<BookingDocument[]> {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const twentyFiveMinsAgo = new Date(Date.now() - 25 * 60 * 1000);

    return this.bookingModel
      .find({
        status: BookingStatus.PENDING,
        createdAt: { $lte: fifteenMinsAgo, $gte: twentyFiveMinsAgo },
        reminderSent: { $ne: true },
      })
      .populate("user", "firstName lastName email")
      .exec();
  }

  async markReminderSent(bookingId: string): Promise<void> {
    await this.bookingModel
      .findByIdAndUpdate(bookingId, { reminderSent: true })
      .exec();
  }

  async getStats(tenantId?: string) {
    const matchStage: any = {};
    if (tenantId) matchStage.tenant = new Types.ObjectId(tenantId);

    const stats = await this.bookingModel
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalRevenue: { $sum: "$pricing.totalAmount" },
          },
        },
      ])
      .exec();

    const totalBookings = await this.bookingModel
      .countDocuments(matchStage)
      .exec();
    const totalRevenue = stats
      .filter(
        (s) =>
          s._id === BookingStatus.CONFIRMED || s._id === BookingStatus.TICKETED,
      )
      .reduce((sum, s) => sum + s.totalRevenue, 0);

    return {
      totalBookings,
      totalRevenue,
      byStatus: stats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, revenue: s.totalRevenue };
        return acc;
      }, {}),
    };
  }

  async getAllBookings(
    paginationDto: PaginationDto,
    queryDto?: BookingQueryDto,
  ): Promise<PaginatedResult<BookingDocument>> {
    const query: any = {};
    if (queryDto?.status) query.status = queryDto.status;
    if (queryDto?.tenantId)
      query.tenant = new Types.ObjectId(queryDto.tenantId);
    if (queryDto?.startDate || queryDto?.endDate) {
      query.bookedAt = {};
      if (queryDto.startDate)
        query.bookedAt.$gte = new Date(queryDto.startDate);
      if (queryDto.endDate) query.bookedAt.$lte = new Date(queryDto.endDate);
    }

    return paginate(this.bookingModel, query, paginationDto, [
      "user",
      "tenant",
      "flights.flight",
      "stays.stay",
      "stays.room",
      "cars.car",
      "cruises.cruise",
      "cruises.passengers",
    ]);
  }

  async emailCapture(params: {
    email: string;
    firstName: string;
    destination: string;
    checkoutUrl: string;
    tenantId?: string;
  }): Promise<void> {
    this.logger.log(
      `Email capture triggered for ${params.email} going to ${params.destination}`,
    );

    await this.notificationsService.sendDynamicEmail({
      slug: "booking-capture-draft",
      to: params.email,
      data: {
        firstName: params.firstName,
        destination: params.destination,
        checkoutUrl: params.checkoutUrl,
      },
      tenantId: params.tenantId,
    });
  }

  private async sendAgentBookingNotifications(booking: BookingDocument) {
    const adminEmail = this.nestConfigService.get("ADMIN_EMAIL") || "flybethweb@gmail.com";
    const agentEmail = booking.user ? (booking.user as any).email : booking.contactDetails.email;
    const agentName = booking.user ? (booking.user as any).firstName : (booking.contactDetails.name || 'Guest');

    // Generate PDF Invoice
    const pdfBuffer = await this.invoiceService.generateInvoicePdf(booking);

    // 1. Notify Admin
    const adminSubject = `New Agent Booking: ${booking.pnr}`;
    const adminHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Booking Alert</h2>
            <p><strong>Agent:</strong> ${agentName} (${agentEmail})</p>
            <p><strong>PNR:</strong> ${booking.pnr}</p>
            ${booking.isBatchBooking ? `
              <p><strong>Batch Status:</strong> Yes (${booking.totalPassengers} travelers)</p>
              <p><strong>Batch Label:</strong> ${booking.batchLabel || 'N/A'}</p>
              <p><strong>Traveler List:</strong></p>
              <ul style="font-size: 12px; color: #666;">
                ${booking.flights?.[0]?.passengers?.map((p: any) => `<li>${p.firstName || 'Traveler'} ${p.lastName || ''}</li>`).join('') || '<li>List not available</li>'}
              </ul>
            ` : ''}
            <p><strong>Total Amount:</strong> ${booking.pricing.currency} ${booking.pricing.totalAmount.toLocaleString()}</p>
            <p><strong>Payment Model:</strong> ${booking.paymentModel}</p>
            <hr />
            <p>Log in to the admin dashboard to view full details.</p>
        </div>
    `;
    await this.notificationsService.sendEmail(adminEmail, adminSubject, adminHtml);

    // 2. Notify Agent with Invoice
    const agentSubject = `Booking Confirmed: ${booking.pnr} - Flybeth Global`;
    
    const flightTimelineHtml = this.generateFlightEmailHtml(booking);

    const agentHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Booking Confirmation</title>
    </head>
    <body style="margin:0; padding:0; background-color:#eef2f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#333;">
        <div style="max-width:600px; margin:20px auto; background-color:#ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow:hidden; border-radius:8px;">
            
            <div style="background: linear-gradient(135deg, #d3e5f5 0%, #b2cfee 100%); padding: 30px 40px; text-align: left;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="font-size:22px; font-weight:bold; color:#1a365d; letter-spacing: 1px;">BOOKING CONFIRMATION</td>
                        <td align="right" style="font-size:14px; color:#2d3748; font-weight:bold;">PNR: <span style="color:#1a365d; font-size:16px;">${booking.pnr}</span></td>
                    </tr>
                </table>
            </div>
            
            <div style="padding: 20px 40px; background-color:#f8fafc; border-bottom: 1px solid #e2e8f0;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="padding-bottom:5px;" width="50%">
                            <span style="font-size:11px; color:#718096; text-transform:uppercase; font-weight:bold; letter-spacing:0.5px;">Booking Date</span><br/>
                            <span style="font-size:15px; color:#2d3748; font-weight:500;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </td>
                        <td style="padding-bottom:5px;" width="50%" align="right">
                            <span style="font-size:11px; color:#718096; text-transform:uppercase; font-weight:bold; letter-spacing:0.5px;">Guest Name</span><br/>
                            <span style="font-size:15px; color:#2d3748; font-weight:500;">${agentName}</span>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="padding: 30px 40px;">
                <h3 style="margin:0 0 20px 0; color:#1a365d; font-size:16px; text-transform:uppercase; letter-spacing:1px; border-bottom: 2px solid #e2e8f0; padding-bottom:10px;">Flight Details</h3>
                ${flightTimelineHtml}
            </div>

            <div style="padding: 30px 40px; background-color:#f1f5f9;">
                <div style="background-color:#ffffff; border-radius:8px; padding:20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border: 1px solid #e2e8f0;">
                    <h4 style="margin:0 0 10px 0; text-align:center; color:#718096; text-transform:uppercase; font-size:11px; letter-spacing:1.5px;">Payment Receipt</h4>
                    <div style="text-align:center; margin-bottom: 20px;">
                        <span style="font-size:11px; color:#718096; font-weight:bold;">TOTAL CHARGE</span><br/>
                        <span style="font-size:26px; font-weight:900; color:#1a365d; letter-spacing:-0.5px;">${booking.pricing.currency} ${booking.pricing.totalAmount.toLocaleString()}</span>
                    </div>
                    <hr style="border:none; border-top:1px dashed #cbd5e0; margin:15px 0;"/>
                    <table width="100%" style="font-size:13px; color:#4a5568;" cellpadding="4">
                        <tr>
                            <td>Base Fare</td>
                            <td align="right" style="font-weight:500;">${booking.pricing.currency} ${booking.pricing.baseFare.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>Taxes & Surcharges</td>
                            <td align="right" style="font-weight:500;">${booking.pricing.currency} ${booking.pricing.taxes.toLocaleString()}</td>
                        </tr>
                        ${booking.pricing.agentServiceFee > 0 ? `
                        <tr>
                            <td>Service Fee</td>
                            <td align="right" style="font-weight:500;">${booking.pricing.currency} ${booking.pricing.agentServiceFee.toLocaleString()}</td>
                        </tr>
                        ` : ''}
                        ${booking.pricing.insuranceAmount > 0 ? `
                        <tr>
                            <td>Travel Insurance</td>
                            <td align="right" style="font-weight:500;">${booking.pricing.currency} ${booking.pricing.insuranceAmount.toLocaleString()}</td>
                        </tr>
                        ` : ''}
                    </table>
                    <hr style="border:none; border-top:1px solid #e2e8f0; margin:15px 0;"/>
                    <table width="100%" style="font-size:14px; font-weight:bold; color:#1a365d;">
                        <tr>
                            <td>Total Paid</td>
                            <td align="right">${booking.pricing.currency} ${booking.pricing.totalAmount.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div style="padding: 30px 40px; text-align:center; background-color:#ffffff;">
                <h3 style="color:#1a365d; margin:0 0 25px 0; font-size:16px; text-transform:uppercase; letter-spacing:1px;">Get Ready To Go</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align:left;">
                    <tr>
                        <td width="48%" style="vertical-align:top; background-color:#f7fafc; padding:15px; border-radius:6px;">
                            <h4 style="margin:0 0 8px 0; color:#2b6cb0; font-size:14px;">✈️ Arrive On Time</h4>
                            <p style="margin:0; font-size:12px; color:#4a5568; line-height:1.5;">Plan to arrive at the airport at least 3 hours before your scheduled departure time.</p>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" style="vertical-align:top; background-color:#f7fafc; padding:15px; border-radius:6px;">
                            <h4 style="margin:0 0 8px 0; color:#2b6cb0; font-size:14px;">✅ Passport Check</h4>
                            <p style="margin:0; font-size:12px; color:#4a5568; line-height:1.5;">Ensure your passport is valid for 6 months and review destination visa requirements.</p>
                        </td>
                    </tr>
                </table>
                <div style="margin-top:35px; border-top:1px solid #e2e8f0; padding-top:20px;">
                    <p style="font-size:12px; color:#a0aec0; margin:0;">Thank you for booking with Flybeth Global.<br/>Your official PDF invoice is attached to this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    await this.notificationsService.sendEmail(
        agentEmail, 
        agentSubject, 
        agentHtml, 
        {}, 
        [{ filename: `Invoice_${booking.pnr}.pdf`, content: pdfBuffer }]
    );
  }

  private generateFlightEmailHtml(booking: any): string {
      if (!booking.flights || booking.flights.length === 0) {
          return `<p style="color:#718096; font-size:14px; font-style:italic;">No flight itinerary details available in this booking.</p>`;
      }
      
      let html = '';
      booking.flights.forEach((f: any, idx: number) => {
          const flight = f.flight;
          if (!flight) return;
          
          let depDate = 'TBD';
          let arrDate = 'TBD';
          
          try {
              if (flight.departureTime) {
                  depDate = new Date(flight.departureTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
              }
              if (flight.arrivalTime) {
                  arrDate = new Date(flight.arrivalTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
              }
          } catch (e) {
              // Ignore date parsing errors and fallback
          }
          
          html += `
          <div style="margin-bottom: 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                      <!-- Timeline Line -->
                      <td width="30" style="position:relative; vertical-align:top; text-align:center;">
                          <div style="width:12px; height:12px; border-radius:50%; background-color:#3182ce; margin: 4px auto 0 auto;"></div>
                          <div style="width:2px; height:60px; background-color:#cbd5e0; margin: 0 auto;"></div>
                          <div style="width:12px; height:12px; border-radius:50%; border: 2px solid #3182ce; background-color:#fff; margin: 0 auto; box-sizing:border-box;"></div>
                      </td>
                      
                      <!-- Details -->
                      <td style="padding-left:15px;">
                          <!-- Departure -->
                          <div style="margin-bottom: 25px;">
                              <span style="font-size:10px; color:#718096; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">DEPARTURE</span><br/>
                              <span style="font-size:24px; font-weight:bold; color:#2d3748; letter-spacing:-0.5px;">${flight.departureCity || flight.origin || 'Origin'}</span>
                              <div style="font-size:13px; color:#4a5568; margin-top:2px; font-weight:500;">${depDate}</div>
                          </div>
                          
                          <!-- Arrival -->
                          <div>
                              <span style="font-size:10px; color:#718096; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">DESTINATION</span><br/>
                              <span style="font-size:24px; font-weight:bold; color:#2d3748; letter-spacing:-0.5px;">${flight.arrivalCity || flight.destination || 'Destination'}</span>
                              <div style="font-size:13px; color:#4a5568; margin-top:2px; font-weight:500;">${arrDate}</div>
                          </div>
                      </td>
                  </tr>
              </table>
              
              <!-- Flight Meta Info -->
              <div style="margin-top:20px; padding:12px 15px; background-color:#ebf8ff; border-radius:6px; font-size:12px; color:#2b6cb0; display:inline-block; border: 1px solid #bee3f8;">
                  <strong>${flight.airline || 'Airline'}</strong> &nbsp;&bull;&nbsp; Flight ${flight.flightNumber || 'N/A'} &nbsp;&bull;&nbsp; <strong>Class:</strong> ${f.class ? f.class.toUpperCase() : 'N/A'}
              </div>
          </div>
          `;
      });
      return html;
  }
}
