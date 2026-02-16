"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amadeus_provider_1 = require("./providers/amadeus.provider");
const amadeus_experiences_provider_1 = require("./providers/amadeus-experiences.provider");
const amadeus_transfers_provider_1 = require("./providers/amadeus-transfers.provider");
const amadeus_insights_provider_1 = require("./providers/amadeus-insights.provider");
const amadeus_hotels_provider_1 = require("./providers/amadeus-hotels.provider");
const amadeus_itinerary_provider_1 = require("./providers/amadeus-itinerary.provider");
const flights_integration_service_1 = require("./flights-integration.service");
const amadeus_experiences_controller_1 = require("./controllers/amadeus-experiences.controller");
const amadeus_transfers_controller_1 = require("./controllers/amadeus-transfers.controller");
const amadeus_insights_controller_1 = require("./controllers/amadeus-insights.controller");
const amadeus_hotels_controller_1 = require("./controllers/amadeus-hotels.controller");
const amadeus_itinerary_controller_1 = require("./controllers/amadeus-itinerary.controller");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [
            amadeus_experiences_controller_1.AmadeusExperiencesController,
            amadeus_transfers_controller_1.AmadeusTransfersController,
            amadeus_insights_controller_1.AmadeusInsightsController,
            amadeus_hotels_controller_1.AmadeusHotelsController,
            amadeus_itinerary_controller_1.AmadeusItineraryController,
        ],
        providers: [
            amadeus_provider_1.AmadeusProvider,
            flights_integration_service_1.FlightsIntegrationService,
            amadeus_experiences_provider_1.AmadeusExperiencesProvider,
            amadeus_transfers_provider_1.AmadeusTransfersProvider,
            amadeus_insights_provider_1.AmadeusInsightsProvider,
            amadeus_hotels_provider_1.AmadeusHotelsProvider,
            amadeus_itinerary_provider_1.AmadeusItineraryProvider,
        ],
        exports: [
            flights_integration_service_1.FlightsIntegrationService,
            amadeus_experiences_provider_1.AmadeusExperiencesProvider,
            amadeus_transfers_provider_1.AmadeusTransfersProvider,
            amadeus_insights_provider_1.AmadeusInsightsProvider,
            amadeus_hotels_provider_1.AmadeusHotelsProvider,
            amadeus_itinerary_provider_1.AmadeusItineraryProvider,
        ],
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map