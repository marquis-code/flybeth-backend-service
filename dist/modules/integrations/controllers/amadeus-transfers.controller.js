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
exports.AmadeusTransfersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const amadeus_transfers_provider_1 = require("../providers/amadeus-transfers.provider");
let AmadeusTransfersController = class AmadeusTransfersController {
    constructor(provider) {
        this.provider = provider;
    }
    search(body) {
        return this.provider.searchTransfers(body);
    }
    book(offerId, body) {
        return this.provider.bookTransfer(offerId, body);
    }
    cancel(orderId, confirmNbr) {
        return this.provider.cancelTransfer(orderId, confirmNbr);
    }
};
exports.AmadeusTransfersController = AmadeusTransfersController;
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search transfer offers' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AmadeusTransfersController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('book'),
    (0, swagger_1.ApiOperation)({ summary: 'Book a transfer' }),
    (0, swagger_1.ApiQuery)({ name: 'offerId', description: 'Transfer offer ID from search' }),
    __param(0, (0, common_1.Query)('offerId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AmadeusTransfersController.prototype, "book", null);
__decorate([
    (0, common_1.Post)('cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a transfer booking' }),
    (0, swagger_1.ApiQuery)({ name: 'orderId', description: 'Transfer order ID' }),
    (0, swagger_1.ApiQuery)({ name: 'confirmNbr', description: 'Transfer confirmation number' }),
    __param(0, (0, common_1.Query)('orderId')),
    __param(1, (0, common_1.Query)('confirmNbr')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AmadeusTransfersController.prototype, "cancel", null);
exports.AmadeusTransfersController = AmadeusTransfersController = __decorate([
    (0, swagger_1.ApiTags)('Amadeus — Cars & Transfers'),
    (0, common_1.Controller)('amadeus/transfers'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [amadeus_transfers_provider_1.AmadeusTransfersProvider])
], AmadeusTransfersController);
//# sourceMappingURL=amadeus-transfers.controller.js.map