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
    userId: string,
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
    const passengerIds = [...(createBookingDto.flights?.[0]?.passengerIds || [])];
    if (createBookingDto.passengerDetails?.length) {
       for (const pDetail of createBookingDto.passengerDetails) {
          const savedP = await this.passengersService.create(userId, {
            ...pDetail,
            type: 'adult', // Default for now
          });
          passengerIds.push(savedP._id.toString());
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
          
          bookingFlights.push({
            flight: flightDto.flightId, 
            class: flightDto.class,
            passengers: passengerIds.map(id => new Types.ObjectId(id)),
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

          if (flightClass.seatsAvailable < flightDto.passengerIds.length) {
            throw new BadRequestException(
              `Not enough seats available on flight ${flight.flightNumber}`,
            );
          }

          totalBaseFare += flightClass.basePrice * flightDto.passengerIds.length;
          totalTaxes +=
            flightClass.basePrice * flightDto.passengerIds.length * 0.12; // 12% flight tax

          bookingFlights.push({
            flight: flightDto.flightId,
            class: flightDto.class,
            passengers: passengerIds.map(
              (id) => new Types.ObjectId(id),
            ),
            offerId: flightDto.offerId,
            provider: flightDto.provider || 'manual',
          });

          // Reserve seats
          await this.flightsService.updateSeatAvailability(
            flightDto.flightId,
            flightDto.class,
            passengerIds.length,
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

    const totalPassengers =
      (createBookingDto.flights?.reduce(
        (sum, f) => sum + f.passengerIds.length,
        0,
      ) || 0) +
      (createBookingDto.stays?.reduce(
        (sum, s) => sum + s.occupancy.adults + (s.occupancy.children || 0),
        0,
      ) || 0);

    const agentServiceFee = createBookingDto.agentServiceFee || 0;
    const adultMarkup = createBookingDto.adultMarkup || 0;
    const hasInsurance = createBookingDto.hasInsurance || false;
    const insuranceAmount = hasInsurance ? 25 * totalPassengers : 0; // Fixed $25 per passenger for demo

    const totalAmount = totalBaseFare + totalTaxes + tenantMarkup + agentServiceFee + (adultMarkup * (createBookingDto.flights?.[0]?.passengerIds?.length || 1)) + insuranceAmount - discount;

    const booking = new this.bookingModel({
      pnr: pnr.toUpperCase(),
      user: new Types.ObjectId(userId),
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
      ipAddress: createBookingDto.ipAddress,
      deviceFingerprint: createBookingDto.deviceFingerprint,
      userAgent: createBookingDto.userAgent,
      termsAcceptedAt: new Date(),
    });

    const saved = await booking.save();

     // 5. Handle Payment immediately if Wallet
     if (createBookingDto.paymentProvider === 'wallet') {
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
                const passengers = await this.passengersService.findByIds(passengerIds);
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
     // 5.1 Handle Hold Order Logic
     else if (createBookingDto.paymentModel === 'on_hold') {
       try {
         if (saved.flights?.length) {
           const flight = saved.flights[0];
           if (flight.offerId && flight.provider) {
              const passengers = await this.passengersService.findByIds(passengerIds);
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

    this.logger.log(`Booking created: ${saved.pnr} for user ${userId}`);

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

  async findUserBookings(
    userId: string,
    paginationDto: PaginationDto,
    queryDto?: BookingQueryDto,
  ): Promise<PaginatedResult<BookingDocument>> {
    const query: any = { user: new Types.ObjectId(userId) };
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
    const adminEmail = this.nestConfigService.get("ADMIN_EMAIL") || "admin@flybeth.com";
    const agentEmail = (booking.user as any).email;
    const agentName = (booking.user as any).firstName;

    // Generate PDF Invoice
    const pdfBuffer = await this.invoiceService.generateInvoicePdf(booking);

    // 1. Notify Admin
    const adminSubject = `New Agent Booking: ${booking.pnr}`;
    const adminHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Booking Alert</h2>
            <p><strong>Agent:</strong> ${agentName} (${agentEmail})</p>
            <p><strong>PNR:</strong> ${booking.pnr}</p>
            <p><strong>Total Amount:</strong> ${booking.pricing.currency} ${booking.pricing.totalAmount.toLocaleString()}</p>
            <p><strong>Payment Model:</strong> ${booking.paymentModel}</p>
            <hr />
            <p>Log in to the admin dashboard to view full details.</p>
        </div>
    `;
    await this.notificationsService.sendEmail(adminEmail, adminSubject, adminHtml);

    // 2. Notify Agent with Invoice
    const agentSubject = `Booking Received: ${booking.pnr} - Flybeth Agent`;
    const agentHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Booking Confirmation</h2>
            <p>Hi ${agentName},</p>
            <p>Your booking <strong>${booking.pnr}</strong> has been successfully received. We have attached the invoice for your records.</p>
            <p><strong>Status:</strong> ${booking.status.toUpperCase()}</p>
            <p><strong>Total:</strong> ${booking.pricing.currency} ${booking.pricing.totalAmount.toLocaleString()}</p>
            <br />
            <p>Thank you for partnering with Flybeth!</p>
        </div>
    `;
    await this.notificationsService.sendEmail(
        agentEmail, 
        agentSubject, 
        agentHtml, 
        {}, 
        [{ filename: `Invoice_${booking.pnr}.pdf`, content: pdfBuffer }]
    );
  }
}
