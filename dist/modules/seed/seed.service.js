"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const airport_schema_1 = require("../airports/schemas/airport.schema");
let SeedService = SeedService_1 = class SeedService {
    constructor(airportModel, airlineModel) {
        this.airportModel = airportModel;
        this.airlineModel = airlineModel;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async onModuleInit() {
        await this.seedAirports();
        await this.seedAirlines();
    }
    async seedAirports() {
        const count = await this.airportModel.countDocuments().exec();
        if (count > 0)
            return;
        const airports = [
            { code: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos', country: 'Nigeria', lat: 6.5774, lng: 3.3214, timezone: 'Africa/Lagos' },
            { code: 'ABV', name: 'Nnamdi Azikiwe International Airport', city: 'Abuja', country: 'Nigeria', lat: 9.0069, lng: 7.2632, timezone: 'Africa/Lagos' },
            { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lng: -0.4543, timezone: 'Europe/London' },
            { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', lat: 40.6413, lng: -73.7781, timezone: 'America/New_York' },
            { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', lat: 25.2528, lng: 55.3644, timezone: 'Asia/Dubai' },
            { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479, timezone: 'Europe/Paris' },
            { code: 'AMS', name: 'Amsterdam Schiphol Airport', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683, timezone: 'Europe/Amsterdam' },
            { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622, timezone: 'Europe/Berlin' },
            { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915, timezone: 'Asia/Singapore' },
            { code: 'NBO', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lng: 36.9278, timezone: 'Africa/Nairobi' },
            { code: 'ACC', name: 'Kotoka International Airport', city: 'Accra', country: 'Ghana', lat: 5.6052, lng: -0.1668, timezone: 'Africa/Accra' },
            { code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', lat: -33.9649, lng: 18.6017, timezone: 'Africa/Johannesburg' },
            { code: 'JNB', name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', lat: -26.1392, lng: 28.2460, timezone: 'Africa/Johannesburg' },
            { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', lat: 30.1219, lng: 31.4056, timezone: 'Africa/Cairo' },
            { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lng: 28.7519, timezone: 'Europe/Istanbul' },
            { code: 'ADD', name: 'Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9779, lng: 38.7993, timezone: 'Africa/Addis_Ababa' },
            { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', lat: 33.9425, lng: -118.4081, timezone: 'America/Los_Angeles' },
            { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', lat: 41.9742, lng: -87.9073, timezone: 'America/Chicago' },
            { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798, timezone: 'Asia/Tokyo' },
            { code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', lat: 40.0799, lng: 116.6031, timezone: 'Asia/Shanghai' },
            { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656, timezone: 'Asia/Kolkata' },
            { code: 'PHC', name: 'Port Harcourt International Airport', city: 'Port Harcourt', country: 'Nigeria', lat: 5.0151, lng: 6.9496, timezone: 'Africa/Lagos' },
            { code: 'KAN', name: 'Mallam Aminu Kano International Airport', city: 'Kano', country: 'Nigeria', lat: 12.0476, lng: 8.5247, timezone: 'Africa/Lagos' },
            { code: 'ENU', name: 'Akanu Ibiam International Airport', city: 'Enugu', country: 'Nigeria', lat: 6.4743, lng: 7.5620, timezone: 'Africa/Lagos' },
            { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', lat: 33.6407, lng: -84.4277, timezone: 'America/New_York' },
        ];
        await this.airportModel.insertMany(airports);
        this.logger.log(`Seeded ${airports.length} airports`);
    }
    async seedAirlines() {
        const count = await this.airlineModel.countDocuments().exec();
        if (count > 0)
            return;
        const airlines = [
            { code: 'W3', name: 'Arik Air', country: 'Nigeria', isActive: true },
            { code: 'P4', name: 'Air Peace', country: 'Nigeria', isActive: true },
            { code: 'VK', name: 'Value Jet', country: 'Nigeria', isActive: true },
            { code: 'QR', name: 'Green Africa Airways', country: 'Nigeria', isActive: true },
            { code: 'ET', name: 'Ethiopian Airlines', country: 'Ethiopia', isActive: true },
            { code: 'KQ', name: 'Kenya Airways', country: 'Kenya', isActive: true },
            { code: 'SA', name: 'South African Airways', country: 'South Africa', isActive: true },
            { code: 'MS', name: 'EgyptAir', country: 'Egypt', isActive: true },
            { code: 'AT', name: 'Royal Air Maroc', country: 'Morocco', isActive: true },
            { code: 'BA', name: 'British Airways', country: 'United Kingdom', isActive: true },
            { code: 'EK', name: 'Emirates', country: 'UAE', isActive: true },
            { code: 'QR2', name: 'Qatar Airways', country: 'Qatar', isActive: true },
            { code: 'TK', name: 'Turkish Airlines', country: 'Turkey', isActive: true },
            { code: 'KL', name: 'KLM Royal Dutch Airlines', country: 'Netherlands', isActive: true },
            { code: 'AF', name: 'Air France', country: 'France', isActive: true },
            { code: 'LH', name: 'Lufthansa', country: 'Germany', isActive: true },
            { code: 'AA', name: 'American Airlines', country: 'United States', isActive: true },
            { code: 'DL', name: 'Delta Air Lines', country: 'United States', isActive: true },
            { code: 'UA', name: 'United Airlines', country: 'United States', isActive: true },
            { code: 'SQ', name: 'Singapore Airlines', country: 'Singapore', isActive: true },
        ];
        await this.airlineModel.insertMany(airlines);
        this.logger.log(`Seeded ${airlines.length} airlines`);
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(airport_schema_1.Airport.name)),
    __param(1, (0, mongoose_1.InjectModel)(airport_schema_1.Airline.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], SeedService);
//# sourceMappingURL=seed.service.js.map