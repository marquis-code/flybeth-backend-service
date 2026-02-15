"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaystackProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
let PaystackProvider = PaystackProvider_1 = class PaystackProvider {
    constructor(configService) {
        this.configService = configService;
        this.baseUrl = 'https://api.paystack.co';
        this.logger = new common_1.Logger(PaystackProvider_1.name);
        this.secretKey = this.configService.get('PAYSTACK_SECRET_KEY') || '';
        this.webhookSecret = this.configService.get('PAYSTACK_WEBHOOK_SECRET') || '';
    }
    getHeaders() {
        return {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
        };
    }
    async initializeTransaction(params) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/transaction/initialize`, {
                amount: Math.round(params.amount * 100),
                currency: params.currency.toUpperCase(),
                email: params.email,
                reference: params.reference,
                callback_url: params.callbackUrl,
                metadata: {
                    custom_fields: [
                        {
                            display_name: 'Booking Reference',
                            variable_name: 'booking_reference',
                            value: params.metadata?.bookingId || '',
                        },
                    ],
                    ...params.metadata,
                },
            }, { headers: this.getHeaders() });
            return {
                authorizationUrl: response.data.data.authorization_url,
                accessCode: response.data.data.access_code,
                reference: response.data.data.reference,
            };
        }
        catch (error) {
            this.logger.error(`Paystack initialization failed: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }
    async verifyTransaction(reference) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/transaction/verify/${reference}`, { headers: this.getHeaders() });
            return {
                status: response.data.data.status,
                amount: response.data.data.amount / 100,
                currency: response.data.data.currency,
                reference: response.data.data.reference,
                paidAt: response.data.data.paid_at,
                channel: response.data.data.channel,
                metadata: response.data.data.metadata,
            };
        }
        catch (error) {
            this.logger.error(`Paystack verification failed: ${error.message}`);
            throw error;
        }
    }
    async refund(transactionReference, amount) {
        try {
            const body = { transaction: transactionReference };
            if (amount) {
                body.amount = Math.round(amount * 100);
            }
            const response = await axios_1.default.post(`${this.baseUrl}/refund`, body, { headers: this.getHeaders() });
            return {
                refundId: response.data.data.id,
                status: response.data.data.status,
                amount: response.data.data.amount / 100,
            };
        }
        catch (error) {
            this.logger.error(`Paystack refund failed: ${error.message}`);
            throw error;
        }
    }
    verifyWebhookSignature(payload, signature) {
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(payload)
            .digest('hex');
        return hash === signature;
    }
};
exports.PaystackProvider = PaystackProvider;
exports.PaystackProvider = PaystackProvider = PaystackProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaystackProvider);
//# sourceMappingURL=paystack.provider.js.map