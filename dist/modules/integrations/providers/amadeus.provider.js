"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AmadeusProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmadeusProvider = void 0;
const common_1 = require("@nestjs/common");
let AmadeusProvider = AmadeusProvider_1 = class AmadeusProvider {
    constructor() {
        this.providerName = 'Amadeus';
        this.logger = new common_1.Logger(AmadeusProvider_1.name);
    }
    async searchFlights(query) {
        this.logger.log(`Searching Amadeus for ${query.origin} -> ${query.destination}`);
        return [
            {
                provider: 'Amadeus',
                flightNumber: 'LH123',
                airline: 'Lufthansa',
                origin: query.origin,
                destination: query.destination,
                departureTime: new Date(query.departureDate).toISOString(),
                arrivalTime: new Date(new Date(query.departureDate).getTime() + 6 * 3600 * 1000).toISOString(),
                duration: 360,
                price: 450,
                currency: 'USD',
                seatsAvailable: 9,
            },
            {
                provider: 'Amadeus',
                flightNumber: 'AF456',
                airline: 'Air France',
                origin: query.origin,
                destination: query.destination,
                departureTime: new Date(query.departureDate).toISOString(),
                arrivalTime: new Date(new Date(query.departureDate).getTime() + 7 * 3600 * 1000).toISOString(),
                duration: 420,
                price: 420,
                currency: 'USD',
                seatsAvailable: 5,
            },
        ];
    }
    async bookFlight(flightId, passengers) {
        this.logger.log(`Booking flight ${flightId} on Amadeus for ${passengers.length} passengers`);
        return {
            pnr: 'AM' + Math.random().toString(36).substring(7).toUpperCase(),
            ticketNumbers: passengers.map(() => 'TKT' + Math.floor(Math.random() * 1000000)),
        };
    }
    async cancelBooking(pnr) {
        this.logger.log(`Cancelling Amadeus booking ${pnr}`);
        return true;
    }
};
exports.AmadeusProvider = AmadeusProvider;
exports.AmadeusProvider = AmadeusProvider = AmadeusProvider_1 = __decorate([
    (0, common_1.Injectable)()
], AmadeusProvider);
//# sourceMappingURL=amadeus.provider.js.map