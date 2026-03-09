// src/modules/cars/cars.service.ts
import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Car, CarDocument } from "./schemas/car.schema";
import { SearchCarsDto, CreateCarDto } from "./dto/car.dto";
import { CarsIntegrationService } from "../integrations/cars-integration.service";
import { CarSearchQuery, CarSearchResult } from "../integrations/interfaces/car-adapter.interface";

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  constructor(
    @InjectModel(Car.name) private carModel: Model<CarDocument>,
    private carsIntegrationService: CarsIntegrationService,
  ) { }

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

    // Fetch from database
    const dbCars = await this.carModel.find(query).exec();

    // Fetch from live integrations (Sabre)
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
        const integrationResults = await this.carsIntegrationService.search(liveQuery);
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
