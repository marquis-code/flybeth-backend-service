// src/modules/cars/cars.service.ts
import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Car, CarDocument } from "./schemas/car.schema";
import { SearchCarsDto, CreateCarDto, CreateCarQuoteDto, BookCarDto } from "./dto/car.dto";
import { CarsIntegrationService } from "../integrations/cars-integration.service";
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
  ) {}

  async search(searchDto: SearchCarsDto): Promise<any> {
    const query: any = {
      isAvailable: true,
    };

    if (searchDto.type) {
      query.type = searchDto.type;
    }

    if (searchDto.pickUpLocation) {
      query.availableLocations = {
        $in: [new RegExp(searchDto.pickUpLocation, "i")],
      };
    }

    if (searchDto.category) {
      query.category = searchDto.category;
    }

    if (searchDto.passengers) {
      query["capacity.passengers"] = { $gte: searchDto.passengers };
    }

    // Fetch from database - MOCK CARS DISABLED FOR PRODUCTION
    const dbCars: any[] = []; // await this.carModel.find(query).exec();

    // Fetch from live integrations
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

    return {
      dbResults: dbCars,
      liveResults: liveCars,
    };
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
