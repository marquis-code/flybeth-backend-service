// src/modules/cars/cars.service.ts
import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Car, CarDocument } from "./schemas/car.schema";
import { SearchCarsDto, CreateCarDto, CreateCarQuoteDto, BookCarDto, normalizeCarSearch } from "./dto/car.dto";
import { CarsIntegrationService } from "../integrations/cars-integration.service";
import { ProviderConfigService } from "../integrations/provider-config.service";
import {
  CarSearchQuery,
  CarSearchResult,
} from "../integrations/interfaces/car-adapter.interface";

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  constructor(
    @InjectModel(Car.name) private carModel: Model<CarDocument>,
    private carsIntegrationService: CarsIntegrationService,
    private providerConfigService: ProviderConfigService,
  ) {}

  async search(rawSearchDto: SearchCarsDto): Promise<any> {
    const searchDto = normalizeCarSearch(rawSearchDto);

    const query: any = {
      isAvailable: true,
    };

    if (searchDto.type) {
      query.type = searchDto.type;
    }

    if (searchDto.category) {
      query.category = new RegExp(`^${this.escapeRegex(searchDto.category)}$`, "i");
    }

    if (searchDto.passengers) {
      query["capacity.passengers"] = { $gte: searchDto.passengers };
    }

    // ── Platform inventory ────────────────────────────────────────────────
    // Search our own fleet first. The location filter is applied softly: a
    // booking is still possible from any hub, so we only narrow the list when
    // the requested city actually has vehicles.
    let dbCars: any[] = await this.carModel.find(query).lean().exec();

    if (searchDto.pickUpLocation && dbCars.length) {
      const locationRx = new RegExp(
        this.escapeRegex(searchDto.pickUpLocation),
        "i",
      );
      const localMatches = dbCars.filter((car: any) =>
        (car.availableLocations || []).some((loc: string) =>
          locationRx.test(loc),
        ),
      );
      if (localMatches.length) {
        dbCars = localMatches;
      } else {
        this.logger.log(
          `No platform cars listed in "${searchDto.pickUpLocation}"; returning the full available fleet.`,
        );
      }
    }

    const normalizedDbCars = await Promise.all(
      dbCars.map((car: any) => this.normalizeCar(car, searchDto)),
    );

    // ── Live providers ────────────────────────────────────────────────────
    let liveCars: CarSearchResult[] = [];
    if (searchDto.pickUpLocation && searchDto.pickUpDate) {
      try {
        const liveQuery: CarSearchQuery = {
          pickUpLocation: searchDto.pickUpLocation,
          returnLocation: searchDto.dropOffLocation || searchDto.pickUpLocation,
          pickUpDate: searchDto.pickUpDate,
          pickUpTime: searchDto.pickUpTime || "10:00",
          returnDate: searchDto.dropOffDate || searchDto.pickUpDate,
          returnTime: searchDto.dropOffTime || "10:00",
          currencyCode: searchDto.currency || "USD",
        };

        // Pass the driver fields for Duffel compatibility
        (liveQuery as any).driverAge = searchDto.driverAge;
        (liveQuery as any).driverCountryCode = searchDto.driverCountryCode;

        const integrationResults =
          await this.carsIntegrationService.search(liveQuery);
        liveCars = integrationResults.results;
      } catch (error) {
        this.logger.error(`Integration search failed: ${error.message}`);
      }
    }

    const results = [...normalizedDbCars, ...liveCars];

    return {
      dbResults: normalizedDbCars,
      liveResults: liveCars,
      // Generic shape so any client can consume the response without knowing
      // about the two internal sources.
      results,
      meta: {
        providersQueried: ['flybeth', 'duffel-cars', 'booking-cars'],
        totalResults: results.length,
      },
    };
  }

  /**
   * Flattens the stored car document into the shape the user app renders:
   * a top-level price, name, category plus the specification fields used by the
   * search filters.
   */
  private async normalizeCar(car: any, searchDto: SearchCarsDto) {
    const days = this.rentalDays(searchDto.pickUpDate, searchDto.dropOffDate);
    // Inventory created by different generations of the admin UI stores the
    // rate under `pricing.baseRate`, `pricing.basePrice` or `price.amount`.
    const dailyRate =
      Number(car.pricing?.baseRate) ||
      Number(car.pricing?.basePrice) ||
      Number(car.price?.amount) ||
      Number(car.price) ||
      0;
    const currency =
      car.pricing?.currency || car.price?.currency || 'USD';
    const netTotal = Math.round(dailyRate * days * 100) / 100;

    // Platform cars do not pass through the cars integration service, so the
    // customer-facing commission is applied here — using the same rate the
    // bookings module charges, so the displayed price equals the charge.
    const customerTotal =
      await this.providerConfigService.applySegmentedCommission(
        netTotal,
        'customer',
      );
    const customerDaily =
      Math.round((customerTotal / Math.max(1, days)) * 100) / 100;

    const specs = car.specifications || car.vehicle || {};

    return {
      ...car,
      id: car._id?.toString(),
      provider: 'flybeth',
      name: car.name || car.vehicle?.name || 'Rental car',
      category: car.category || car.vehicle?.type,
      vendor: car.vendor?.name || car.vendor,
      type: car.type,
      transmission: specs.transmission,
      fuelType: specs.fuelType,
      airConditioning: specs.airConditioning ?? true,
      doors: specs.doors,
      seats: car.capacity?.passengers || car.vehicle?.passengers,
      luggage: car.capacity?.luggage || car.vehicle?.bagsLarge,
      image: (car.images || car.vehicle?.images || [])[0],
      images: car.images || car.vehicle?.images || [],
      freeCancellation: true,
      rentalDays: days,
      currency,
      // Net (supplier) figures — used by the bookings module for pricing.
      dailyRate,
      netTotal,
      pricing: {
        ...(car.pricing || {}),
        baseRate: dailyRate,
        currency,
        // Customer-facing figures used by the UI.
        basePrice: customerDaily,
        total: customerTotal,
      },
      // `price` is the customer-facing total for the rental period.
      price: customerTotal,
      priceWithCommission: customerTotal,
    };
  }

  private rentalDays(pickUpDate?: string, dropOffDate?: string): number {
    if (!pickUpDate || !dropOffDate) return 1;
    const from = new Date(pickUpDate).getTime();
    const to = new Date(dropOffDate).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 1;
    return Math.max(1, Math.ceil((to - from) / 86400000));
  }

  private escapeRegex(value: string): string {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async createQuote(createQuoteDto: CreateCarQuoteDto): Promise<any> {
    // For now, assume it's duffel-cars. We can make it dynamic later if needed
    // based on the rate ID prefix.
    const provider = "duffel-cars";
    return this.carsIntegrationService.createQuote(createQuoteDto.rateId, provider);
  }

  async book(bookDto: BookCarDto): Promise<any> {
    const provider = "duffel-cars";
    // Map our generic driver DTO to the Duffel format
    const driverPayload = {
      user_id: bookDto.driver.userId,
      phone_number: bookDto.driver.phoneNumber,
      given_name: bookDto.driver.givenName,
      family_name: bookDto.driver.familyName,
      email: bookDto.driver.email,
      date_of_birth: bookDto.driver.dateOfBirth,
    };

    return this.carsIntegrationService.bookCar(bookDto.quoteId, driverPayload, provider);
  }

  async cancelBooking(bookingId: string): Promise<any> {
    const provider = "duffel-cars";
    return this.carsIntegrationService.cancelBooking(bookingId, provider);
  }

  async findById(id: string): Promise<CarDocument> {
    const car = await this.carModel.findById(id).exec();
    if (!car) throw new NotFoundException(`Car with ID ${id} not found`);
    return car;
  }

  async create(createCarDto: CreateCarDto): Promise<CarDocument> {
    const newCar = new this.carModel(createCarDto);
    return newCar.save();
  }

  async findAll(): Promise<CarDocument[]> {
    return this.carModel.find().exec();
  }
}
