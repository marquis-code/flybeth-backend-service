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
            metadata: flightDto.metadata,
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

      // If no explicit flights/stays were mapped, use the package's base price multiplied by passenger count
      if (totalBaseFare === 0) {
        totalBaseFare = pkg.basePrice * (createBookingDto.passengerDetails?.length || 1);
      }

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

    let totalPassengers =
      (bookingFlights.reduce(
        (sum, f) => sum + f.passengers.length,
        0,
      ) || 0) +
      (bookingStays.reduce(
        (sum, s) => sum + s.occupancy.adults + (s.occupancy.children || 0),
        0,
      ) || 0);

    if (totalPassengers === 0 && createBookingDto.packageId) {
      totalPassengers = createBookingDto.passengerDetails?.length || 1;
    }

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
      try {
        const pdfBuffer = await this.invoiceService.generateInvoicePdf(booking as any);
        const destination = booking.flights && booking.flights.length > 0 
          ? ((booking.flights[0].flight as any)?.arrival?.city || booking.flights[0].metadata?.destination || 'your destination')
          : 'your destination';

        await this.notificationsService.sendBookingConfirmation({
          email: booking.contactDetails?.email,
          booking: booking,
          attachments: [{ filename: `Receipt_${booking.pnr}.pdf`, content: pdfBuffer }]
        });
      } catch (err) {
        this.logger.error(`Failed to send manage booking email for PNR ${booking.pnr}`, err);
      }
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



  async generateReceiptPdf(pnr: string): Promise<Buffer> {
    const booking = await this.findByPNR(pnr);
    return this.invoiceService.generateInvoicePdf(booking);
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

    
    const flightsHtml = (booking.flights && booking.flights.length > 0) ? booking.flights.map((f: any) => {
        const flight = f.flight;
        if (!flight) return '';
        
        const origin = flight.departure?.iataCode || f.metadata?.origin || 'TBD';
        const dest = flight.arrival?.iataCode || f.metadata?.destination || 'TBD';
        const airline = f.metadata?.airline || 'N/A';
        const flightNbr = flight.flightNumber || 'N/A';
        const cabinClass = f.class || 'Basic';
        
        return `
        <div class="route-section">
          <div class="section-label">Flight Details</div>
          <div class="route">
            <div class="route-point">
              <div class="route-city">${origin}</div>
              <div class="route-sub">Origin</div>
            </div>
            <div class="route-path">
              <div class="plane-icon">
                <svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l4-1 4 1v-1.2L13 19v-5.5z"/></svg>
              </div>
            </div>
            <div class="route-point dest">
              <div class="route-city">${dest}</div>
              <div class="route-sub">Destination</div>
            </div>
          </div>
          <div class="fare-chip">
            <span>Airline <b>${airline}</b></span>
            <span class="divider">•</span>
            <span>Flight <b>${flightNbr}</b></span>
            <span class="divider">•</span>
            <span>Class <b>${cabinClass}</b></span>
          </div>
        </div>
        `;
    }).join('<div class="perforation"><span class="notch left"></span><span class="notch right"></span></div>') : `
        <div class="route-section">
            <p style="color:#6B7280; font-size:14px; font-style:italic;">No flight itinerary details available in this booking.</p>
        </div>
    `;

    const agentHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Flybeth — Booking Confirmation</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#14213D;
    --ink-soft:#3A4A6B;
    --gold:#C9A24B;
    --gold-deep:#A9822F;
    --cream:#F3EEE2;
    --paper:#FAF7F0;
    --white:#FFFFFF;
    --slate:#6B7280;
    --green:#2F9E68;
    --line:#DCD5C2;
    --shadow: 0 30px 60px -20px rgba(20,33,61,0.35), 0 10px 20px -10px rgba(20,33,61,0.15);
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    padding:48px 16px;
    background:
      radial-gradient(circle at 15% 10%, rgba(201,162,75,0.10), transparent 40%),
      radial-gradient(circle at 85% 90%, rgba(20,33,61,0.06), transparent 45%),
      var(--cream);
    font-family:'Inter', sans-serif;
    color:var(--ink);
    display:flex;
    justify-content:center;
  }

  .ticket{
    width:100%;
    max-width:640px;
    background:var(--white);
    border-radius:22px;
    box-shadow:var(--shadow);
    overflow:hidden;
    position:relative;
  }

  /* ===== HEADER ===== */
  .stub-head{
    background:
      linear-gradient(120deg, var(--ink) 0%, #1E2E52 60%, #223360 100%);
    color:var(--white);
    padding:30px 34px 26px;
    position:relative;
    overflow:hidden;
  }
  .stub-head::after{
    content:"";
    position:absolute;
    right:-40px; top:-60px;
    width:220px; height:220px;
    border-radius:50%;
    background:radial-gradient(circle, rgba(201,162,75,0.18), transparent 70%);
  }
  .brand-row{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    position:relative;
    z-index:1;
  }
  .eyebrow{
    font-size:10.5px;
    letter-spacing:2.5px;
    text-transform:uppercase;
    color:rgba(255,255,255,0.55);
    margin-bottom:4px;
    display:block;
  }
  .pnr-block{
    text-align:right;
  }
  .pnr-code{
    font-family:'IBM Plex Mono', monospace;
    font-size:22px;
    font-weight:600;
    letter-spacing:3px;
    color:var(--gold);
  }
  .status-row{
    margin-top:22px;
    display:flex;
    align-items:center;
    gap:8px;
    position:relative;
    z-index:1;
  }
  .status-dot{
    width:7px;height:7px;border-radius:50%;
    background:#4ADE80;
    box-shadow:0 0 0 3px rgba(74,222,128,0.25);
  }
  .status-text{
    font-size:12.5px;
    letter-spacing:1.2px;
    text-transform:uppercase;
    color:#B9C4DE;
    font-weight:500;
  }

  /* ===== META ROW ===== */
  .meta-row{
    display:flex;
    padding:22px 34px;
    background:var(--paper);
    border-bottom:1px dashed var(--line);
  }
  .meta-col{ flex:1; }
  .meta-col + .meta-col{ text-align:right; }
  .meta-label{
    font-size:10.5px;
    letter-spacing:1.6px;
    text-transform:uppercase;
    color:var(--slate);
    margin-bottom:5px;
  }
  .meta-value{
    font-size:15px;
    font-weight:600;
    color:var(--ink);
  }

  /* ===== ROUTE ===== */
  .route-section{
    padding:34px 34px 26px;
  }
  .section-label{
    font-size:10.5px;
    letter-spacing:2px;
    text-transform:uppercase;
    color:var(--gold-deep);
    font-weight:600;
    margin-bottom:20px;
  }
  .route{
    display:flex;
    align-items:center;
    gap:18px;
  }
  .route-point{ flex:0 0 auto; text-align:left; }
  .route-point.dest{ text-align:right; }
  .route-city{
    font-family:'Fraunces', serif;
    font-size:26px;
    font-weight:600;
    line-height:1.1;
  }
  .route-sub{
    font-size:12px;
    color:var(--slate);
    margin-top:4px;
    letter-spacing:0.3px;
  }
  .route-path{
    flex:1;
    position:relative;
    height:20px;
    display:flex;
    align-items:center;
  }
  .route-path::before{
    content:"";
    position:absolute;
    left:0; right:0; top:50%;
    height:1px;
    background:repeating-linear-gradient(to right, var(--gold) 0 6px, transparent 6px 12px);
    transform:translateY(-50%);
  }
  .plane-icon{
    position:relative;
    margin:0 auto;
    z-index:1;
    background:var(--white);
    width:26px; height:26px;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .plane-icon svg{ width:16px; height:16px; fill:var(--gold-deep); }

  .fare-chip{
    margin-top:22px;
    display:inline-flex;
    gap:14px;
    align-items:center;
    background:var(--paper);
    border:1px solid var(--line);
    border-radius:10px;
    padding:10px 16px;
    font-size:12.5px;
    color:var(--ink-soft);
  }
  .fare-chip b{ color:var(--ink); }
  .fare-chip .divider{ color:var(--line); }

  /* ===== PERFORATION ===== */
  .perforation{
    position:relative;
    height:0;
    border-top:2px dashed var(--line);
    margin:0 0;
  }
  .notch{
    position:absolute;
    width:28px; height:28px;
    background:var(--cream);
    border-radius:50%;
    top:-14px;
  }
  .notch.left{ left:-14px; }
  .notch.right{ right:-14px; }

  /* ===== RECEIPT ===== */
  .receipt{
    padding:30px 34px 8px;
  }
  .receipt-total{
    text-align:center;
    margin-bottom:22px;
  }
  .receipt-total .meta-label{ justify-content:center; margin-bottom:8px; }
  .total-amount{
    font-family:'Fraunces', serif;
    font-size:40px;
    font-weight:600;
    color:var(--ink);
  }
  .total-amount sup{
    font-size:16px;
    font-weight:500;
    color:var(--slate);
    margin-right:4px;
    top:-14px;
  }

  .stamp{
    position:absolute;
    right:36px;
    top:14px;
    width:84px; height:84px;
    border:2px solid var(--green);
    border-radius:50%;
    transform:rotate(-14deg);
    display:flex;
    align-items:center;
    justify-content:center;
    color:var(--green);
    font-family:'IBM Plex Mono', monospace;
    font-size:10.5px;
    font-weight:600;
    letter-spacing:1px;
    text-align:center;
    line-height:1.3;
    opacity:0.85;
  }
  .stamp::before{
    content:"";
    position:absolute;
    inset:6px;
    border:1px dashed var(--green);
    border-radius:50%;
  }
  .receipt-block{ position:relative; }

  .line-item{
    display:flex;
    justify-content:space-between;
    padding:10px 0;
    font-size:13.5px;
    color:var(--ink-soft);
  }
  .line-item.total{
    border-top:1px solid var(--line);
    margin-top:6px;
    padding-top:14px;
    font-size:15px;
    font-weight:600;
    color:var(--ink);
  }
  .line-item span:last-child{ font-family:'IBM Plex Mono', monospace; font-weight:500; }

  /* ===== PREP ===== */
  .prep{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:14px;
    padding:26px 34px 32px;
  }
  .prep-card{
    background:var(--paper);
    border:1px solid var(--line);
    border-radius:12px;
    padding:16px;
  }
  .prep-icon{
    width:30px;height:30px;
    border-radius:8px;
    background:var(--ink);
    display:flex;align-items:center;justify-content:center;
    margin-bottom:10px;
  }
  .prep-icon svg{ width:16px;height:16px; fill:var(--gold); }
  .prep-title{
    font-size:13px;
    font-weight:600;
    margin-bottom:4px;
  }
  .prep-text{
    font-size:11.5px;
    color:var(--slate);
    line-height:1.5;
  }

  /* ===== FOOTER / BARCODE ===== */
  .footer{
    padding:0 34px 34px;
    text-align:center;
  }
  .barcode{
    display:flex;
    justify-content:center;
    gap:2px;
    height:34px;
    margin:0 auto 10px;
    width:fit-content;
  }
  .barcode span{
    display:block;
    width:2px;
    background:var(--ink);
    opacity:0.75;
  }
  .barcode-label{
    font-family:'IBM Plex Mono', monospace;
    font-size:11px;
    letter-spacing:3px;
    color:var(--slate);
    margin-bottom:18px;
  }
  .footer-note{
    font-size:12px;
    color:var(--slate);
    line-height:1.6;
  }
  .footer-note b{ color:var(--ink-soft); }

  @media (max-width:480px){
    .route-city{ font-size:20px; }
    .total-amount{ font-size:32px; }
    .stamp{ width:66px;height:66px; right:20px; top:8px; font-size:9px;}
    .prep{ grid-template-columns:1fr; }
    .meta-row, .route-section, .receipt, .footer{ padding-left:22px; padding-right:22px; }
    .stub-head{ padding:26px 22px 22px; }
  }
</style>
</head>
<body>

<div class="ticket">

  <!-- HEADER -->
  <div class="stub-head">
    <div class="brand-row">
      <div>
        <span class="eyebrow">Booking Confirmation</span>
        <img src="https://res.cloudinary.com/marquis/image/upload/v1780815566/logo_dovk4t.png" alt="Flybeth" style="height: 36px;" />
      </div>
      <div class="pnr-block">
        <span class="eyebrow">PNR</span>
        <div class="pnr-code">${booking.pnr}</div>
      </div>
    </div>
    <div class="status-row">
      <span class="status-dot"></span>
      <span class="status-text">${booking.paymentModel === 'pay_now' ? 'Confirmed &amp; Ticketed' : 'Pending Payment'}</span>
    </div>
  </div>

  <!-- META -->
  <div class="meta-row">
    <div class="meta-col">
      <div class="meta-label">Booking Date</div>
      <div class="meta-value">${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    <div class="meta-col">
      <div class="meta-label">Guest Name</div>
      <div class="meta-value">${agentName}</div>
    </div>
  </div>

  <!-- ROUTE -->
  ${flightsHtml}

  <div class="perforation"><span class="notch left"></span><span class="notch right"></span></div>

  <!-- RECEIPT -->
  <div class="receipt">
    <div class="receipt-block">
      <div class="stamp">${booking.paymentModel === 'pay_now' ? 'PAID<br>IN FULL' : 'PENDING'}</div>
      <div class="receipt-total">
        <div class="meta-label">Total Charge</div>
        <div class="total-amount"><sup>${booking.pricing.currency}</sup>${booking.pricing.totalAmount.toLocaleString()}</div>
      </div>
      <div class="line-item"><span>Base Fare</span><span>${booking.pricing.currency} ${booking.pricing.baseFare.toLocaleString()}</span></div>
      <div class="line-item"><span>Taxes &amp; Surcharges</span><span>${booking.pricing.currency} ${booking.pricing.taxes.toLocaleString()}</span></div>
      ${booking.pricing.agentServiceFee > 0 ? `<div class="line-item"><span>Service Fee</span><span>${booking.pricing.currency} ${booking.pricing.agentServiceFee.toLocaleString()}</span></div>` : ''}
      ${booking.pricing.insuranceAmount > 0 ? `<div class="line-item"><span>Travel Insurance</span><span>${booking.pricing.currency} ${booking.pricing.insuranceAmount.toLocaleString()}</span></div>` : ''}
      <div class="line-item total"><span>Total Paid</span><span>${booking.pricing.currency} ${booking.pricing.totalAmount.toLocaleString()}</span></div>
    </div>
  </div>

  <!-- PREP -->
  <div class="prep">
    <div class="prep-card">
      <div class="prep-icon"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l4-1 4 1v-1.2L13 19v-5.5z"/></svg></div>
      <div class="prep-title">Arrive on time</div>
      <div class="prep-text">Plan to arrive at least 3 hours before your scheduled departure.</div>
    </div>
    <div class="prep-card">
      <div class="prep-icon"><svg viewBox="0 0 24 24"><path d="M12 2C7 2 3 5.5 3 10c0 6.5 9 12 9 12s9-5.5 9-12c0-4.5-4-8-9-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg></div>
      <div class="prep-title">Passport check</div>
      <div class="prep-text">Ensure it's valid for 6 months and review visa requirements.</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="barcode">
      <span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span>
    </div>
    <div class="barcode-label">${booking.pnr}</div>
    <div class="footer-note">Thank you for booking with <b>Flybeth Global</b>.<br>Your official PDF invoice is attached to this email.</div>
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
