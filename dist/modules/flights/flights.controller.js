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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const flights_service_1 = require("./flights.service");
const flight_dto_1 = require("./dto/flight.dto");
const amadeus_flight_dto_1 = require("./dto/amadeus-flight.dto");
const flights_integration_service_1 = require("../integrations/flights-integration.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const mongo_id_validation_pipe_1 = require("../../common/pipes/mongo-id-validation.pipe");
let FlightsController = class FlightsController {
    constructor(flightsService, flightsIntegrationService) {
        this.flightsService = flightsService;
        this.flightsIntegrationService = flightsIntegrationService;
    }
    amadeusSearch(searchDto) {
        return this.flightsIntegrationService.searchAmadeusOffers(searchDto);
    }
    amadeusSearchPost(body) {
        return this.flightsIntegrationService.searchAmadeusOffersPost(body);
    }
    amadeusPrice(priceDto) {
        return this.flightsIntegrationService.priceAmadeusOffer(priceDto);
    }
    amadeusOrder(orderDto) {
        return this.flightsIntegrationService.createAmadeusOrder(orderDto);
    }
    amadeusGetOrder(orderId) {
        return this.flightsIntegrationService.getAmadeusOrder(orderId);
    }
    amadeusDeleteOrder(orderId) {
        return this.flightsIntegrationService.deleteAmadeusOrder(orderId);
    }
    amadeusSeatmapByOrder(flightOrderId) {
        return this.flightsIntegrationService.getSeatmapByOrder(flightOrderId);
    }
    amadeusSeatmapByOffer(body) {
        return this.flightsIntegrationService.getSeatmapByOffer(body);
    }
    amadeusUpsell(body) {
        return this.flightsIntegrationService.brandedFaresUpsell(body);
    }
    amadeusPriceAnalysis(originIataCode, destinationIataCode, departureDate, currencyCode, oneWay) {
        return this.flightsIntegrationService.flightPriceAnalysis({
            originIataCode, destinationIataCode, departureDate, currencyCode, oneWay,
        });
    }
    amadeusPrediction(body) {
        return this.flightsIntegrationService.flightChoicePrediction(body);
    }
    amadeusInspiration(params) {
        return this.flightsIntegrationService.flightInspirationSearch(params);
    }
    amadeusCheapestDates(params) {
        return this.flightsIntegrationService.flightCheapestDate(params);
    }
    amadeusAvailabilities(body) {
        return this.flightsIntegrationService.flightAvailabilities(body);
    }
    amadeusRecommendations(params) {
        return this.flightsIntegrationService.travelRecommendations(params);
    }
    amadeusFlightStatus(params) {
        return this.flightsIntegrationService.onDemandFlightStatus(params);
    }
    amadeusDelayPrediction(params) {
        return this.flightsIntegrationService.flightDelayPrediction(params);
    }
    amadeusAirportOnTime(params) {
        return this.flightsIntegrationService.airportOnTimePerformance(params);
    }
    amadeusAirportSearch(params) {
        return this.flightsIntegrationService.airportCitySearch(params);
    }
    amadeusNearestAirports(params) {
        return this.flightsIntegrationService.nearestAirports(params);
    }
    amadeusAirportRoutes(params) {
        return this.flightsIntegrationService.airportRoutes(params);
    }
    amadeusAirportById(locationId) {
        return this.flightsIntegrationService.airportCityById(locationId);
    }
    amadeusCheckinLinks(params) {
        return this.flightsIntegrationService.flightCheckinLinks(params);
    }
    amadeusAirlineLookup(params) {
        return this.flightsIntegrationService.airlineCodeLookup(params);
    }
    amadeusAirlineRoutes(params) {
        return this.flightsIntegrationService.airlineRoutes(params);
    }
    search(searchDto) {
        return this.flightsService.search(searchDto);
    }
    getPopular(limit) {
        return this.flightsService.getPopularFlights(limit);
    }
    getDeals(limit) {
        return this.flightsService.getDeals(limit);
    }
    findOne(id) {
        return this.flightsService.findById(id);
    }
    create(createFlightDto) {
        return this.flightsService.create(createFlightDto);
    }
    update(id, updateFlightDto) {
        return this.flightsService.update(id, updateFlightDto);
    }
    remove(id) {
        return this.flightsService.delete(id);
    }
};
exports.FlightsController = FlightsController;
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search flights via Amadeus (GET)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [amadeus_flight_dto_1.AmadeusSearchDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusSearch", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('amadeus/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search flights via Amadeus (POST — advanced)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusSearchPost", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('amadeus/price'),
    (0, swagger_1.ApiOperation)({ summary: 'Price a flight offer' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [amadeus_flight_dto_1.AmadeusPriceDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusPrice", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, common_1.Post)('amadeus/order'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a flight order (booking)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [amadeus_flight_dto_1.AmadeusOrderDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusOrder", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, common_1.Get)('amadeus/order/:orderId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a flight order by ID' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusGetOrder", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, common_1.Delete)('amadeus/order/:orderId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel/delete a flight order' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusDeleteOrder", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/seatmap'),
    (0, swagger_1.ApiOperation)({ summary: 'Get seatmap by flight order ID' }),
    (0, swagger_1.ApiQuery)({ name: 'flightOrderId', description: 'Amadeus flight order ID' }),
    __param(0, (0, common_1.Query)('flightOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusSeatmapByOrder", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('amadeus/seatmap'),
    (0, swagger_1.ApiOperation)({ summary: 'Get seatmap by flight offer (POST)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusSeatmapByOffer", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('amadeus/upsell'),
    (0, swagger_1.ApiOperation)({ summary: 'Branded fares upsell' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusUpsell", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/price-analysis'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight price analysis (itinerary price metrics)' }),
    (0, swagger_1.ApiQuery)({ name: 'originIataCode', example: 'MAD' }),
    (0, swagger_1.ApiQuery)({ name: 'destinationIataCode', example: 'CDG' }),
    (0, swagger_1.ApiQuery)({ name: 'departureDate', example: '2025-08-01' }),
    (0, swagger_1.ApiQuery)({ name: 'currencyCode', required: false, example: 'EUR' }),
    (0, swagger_1.ApiQuery)({ name: 'oneWay', type: Boolean, required: false }),
    __param(0, (0, common_1.Query)('originIataCode')),
    __param(1, (0, common_1.Query)('destinationIataCode')),
    __param(2, (0, common_1.Query)('departureDate')),
    __param(3, (0, common_1.Query)('currencyCode')),
    __param(4, (0, common_1.Query)('oneWay')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Boolean]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusPriceAnalysis", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('amadeus/prediction'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight choice prediction' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusPrediction", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/inspiration'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight inspiration search — cheapest destinations' }),
    (0, swagger_1.ApiQuery)({ name: 'origin', example: 'BOS' }),
    (0, swagger_1.ApiQuery)({ name: 'departureDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'oneWay', type: Boolean, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'duration', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', type: Number, required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusInspiration", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/cheapest-dates'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight cheapest date search' }),
    (0, swagger_1.ApiQuery)({ name: 'origin', example: 'MAD' }),
    (0, swagger_1.ApiQuery)({ name: 'destination', example: 'LON' }),
    (0, swagger_1.ApiQuery)({ name: 'departureDate', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusCheapestDates", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('amadeus/availabilities'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight availabilities search' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusAvailabilities", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/recommendations'),
    (0, swagger_1.ApiOperation)({ summary: 'Travel recommendations' }),
    (0, swagger_1.ApiQuery)({ name: 'cityCodes', example: 'PAR' }),
    (0, swagger_1.ApiQuery)({ name: 'travelerCountryCode', required: false, example: 'FR' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusRecommendations", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/status'),
    (0, swagger_1.ApiOperation)({ summary: 'On demand flight status' }),
    (0, swagger_1.ApiQuery)({ name: 'carrierCode', example: 'BA' }),
    (0, swagger_1.ApiQuery)({ name: 'flightNumber', example: '986' }),
    (0, swagger_1.ApiQuery)({ name: 'scheduledDepartureDate', example: '2025-08-01' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusFlightStatus", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/delay-prediction'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight delay prediction' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusDelayPrediction", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/airport-ontime'),
    (0, swagger_1.ApiOperation)({ summary: 'Airport on-time performance' }),
    (0, swagger_1.ApiQuery)({ name: 'airportCode', example: 'JFK' }),
    (0, swagger_1.ApiQuery)({ name: 'date', example: '2025-08-01' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusAirportOnTime", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/airports'),
    (0, swagger_1.ApiOperation)({ summary: 'Airport & city search by keyword' }),
    (0, swagger_1.ApiQuery)({ name: 'subType', example: 'CITY,AIRPORT' }),
    (0, swagger_1.ApiQuery)({ name: 'keyword', example: 'MUC' }),
    (0, swagger_1.ApiQuery)({ name: 'countryCode', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusAirportSearch", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/airports/nearest'),
    (0, swagger_1.ApiOperation)({ summary: 'Nearest relevant airports' }),
    (0, swagger_1.ApiQuery)({ name: 'latitude', type: Number, example: 49 }),
    (0, swagger_1.ApiQuery)({ name: 'longitude', type: Number, example: 2.55 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusNearestAirports", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/airports/routes'),
    (0, swagger_1.ApiOperation)({ summary: 'Airport direct destinations / routes' }),
    (0, swagger_1.ApiQuery)({ name: 'departureAirportCode', example: 'MAD' }),
    (0, swagger_1.ApiQuery)({ name: 'max', type: Number, required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusAirportRoutes", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/airports/:locationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Airport & city search by ID' }),
    __param(0, (0, common_1.Param)('locationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusAirportById", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/airlines/checkin-links'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight check-in links' }),
    (0, swagger_1.ApiQuery)({ name: 'airlineCode', example: 'IB' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusCheckinLinks", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/airlines/lookup'),
    (0, swagger_1.ApiOperation)({ summary: 'Airline code lookup' }),
    (0, swagger_1.ApiQuery)({ name: 'airlineCodes', example: 'BA,AIC' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusAirlineLookup", null);
__decorate([
    (0, swagger_1.ApiTags)('Amadeus — Flight Booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('amadeus/airlines/routes'),
    (0, swagger_1.ApiOperation)({ summary: 'Airline routes / destinations' }),
    (0, swagger_1.ApiQuery)({ name: 'airlineCode', example: 'AF' }),
    (0, swagger_1.ApiQuery)({ name: 'max', type: Number, required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "amadeusAirlineRoutes", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search flights from local database' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flight_dto_1.SearchFlightsDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "search", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('popular'),
    (0, swagger_1.ApiOperation)({ summary: 'Get popular/featured flights' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getPopular", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('deals'),
    (0, swagger_1.ApiOperation)({ summary: 'Get flight deals (cheapest)' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getDeals", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get flight by ID' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN, roles_constant_1.Role.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new flight (Admin/Agent)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flight_dto_1.CreateFlightDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN, roles_constant_1.Role.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Update flight details' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, flight_dto_1.UpdateFlightDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a flight' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "remove", null);
exports.FlightsController = FlightsController = __decorate([
    (0, swagger_1.ApiTags)('Flights'),
    (0, common_1.Controller)('flights'),
    __metadata("design:paramtypes", [flights_service_1.FlightsService,
        flights_integration_service_1.FlightsIntegrationService])
], FlightsController);
//# sourceMappingURL=flights.controller.js.map