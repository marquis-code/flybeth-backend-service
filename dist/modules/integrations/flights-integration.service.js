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
var FlightsIntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightsIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const amadeus_provider_1 = require("./providers/amadeus.provider");
let FlightsIntegrationService = FlightsIntegrationService_1 = class FlightsIntegrationService {
    constructor(amadeusProvider) {
        this.amadeusProvider = amadeusProvider;
        this.adapters = [];
        this.logger = new common_1.Logger(FlightsIntegrationService_1.name);
        this.registerAdapter(amadeusProvider);
    }
    registerAdapter(adapter) {
        this.adapters.push(adapter);
        this.logger.log(`Registered airline adapter: ${adapter.providerName}`);
    }
    async searchAllProviders(query) {
        const promises = this.adapters.map(adapter => adapter.searchFlights(query).catch(err => {
            this.logger.error(`Adapter ${adapter.providerName} failed: ${err.message}`);
            return [];
        }));
        const results = await Promise.all(promises);
        return results.flat().sort((a, b) => a.price - b.price);
    }
};
exports.FlightsIntegrationService = FlightsIntegrationService;
exports.FlightsIntegrationService = FlightsIntegrationService = FlightsIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [amadeus_provider_1.AmadeusProvider])
], FlightsIntegrationService);
//# sourceMappingURL=flights-integration.service.js.map