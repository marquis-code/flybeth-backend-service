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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const notification_schema_1 = require("./schemas/notification.schema");
const roles_constant_1 = require("../../common/constants/roles.constant");
const pagination_util_1 = require("../../common/utils/pagination.util");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(notificationModel, configService) {
        this.notificationModel = notificationModel;
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASSWORD'),
            },
        });
    }
    async createNotification(params) {
        const notification = new this.notificationModel({
            user: new mongoose_2.Types.ObjectId(params.userId),
            tenant: params.tenantId ? new mongoose_2.Types.ObjectId(params.tenantId) : null,
            type: params.type,
            title: params.title,
            message: params.message,
            data: params.data,
            channel: params.channel || roles_constant_1.NotificationChannel.IN_APP,
        });
        return notification.save();
    }
    async sendEmail(to, subject, html) {
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM'),
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent to: ${to} (${subject})`);
        }
        catch (error) {
            this.logger.error(`Email send failed: ${error.message}`);
        }
    }
    async sendBookingConfirmation(params) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #003580 0%, #0071c2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Booking Confirmed ✈️</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p>Dear ${params.firstName},</p>
          <p>Your booking has been confirmed!</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #003580; margin-top: 0;">Booking Reference: ${params.pnr}</h3>
            <p><strong>Flight:</strong> ${params.flightDetails}</p>
            <p><strong>Total Paid:</strong> ${params.currency} ${params.totalAmount.toLocaleString()}</p>
          </div>
          <p>Thank you for choosing our service!</p>
        </div>
        <div style="background: #003580; padding: 15px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">© 2025 Flight Booking. All rights reserved.</p>
        </div>
      </div>
    `;
        await this.sendEmail(params.email, `Booking Confirmed - ${params.pnr}`, html);
    }
    async sendPaymentReceipt(params) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Receipt 💳</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p>Dear ${params.firstName},</p>
          <p>Your payment has been processed successfully.</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${params.currency} ${params.amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${params.reference}</p>
            <p><strong>Booking PNR:</strong> ${params.pnr}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `;
        await this.sendEmail(params.email, `Payment Receipt - ${params.reference}`, html);
    }
    async getUserNotifications(userId, paginationDto) {
        return (0, pagination_util_1.paginate)(this.notificationModel, { user: new mongoose_2.Types.ObjectId(userId) }, { ...paginationDto, sortBy: 'createdAt', sortOrder: 'desc' });
    }
    async markAsRead(id) {
        return this.notificationModel
            .findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true })
            .exec();
    }
    async markAllAsRead(userId) {
        await this.notificationModel.updateMany({ user: new mongoose_2.Types.ObjectId(userId), isRead: false }, { isRead: true, readAt: new Date() }).exec();
    }
    async getUnreadCount(userId) {
        return this.notificationModel.countDocuments({
            user: new mongoose_2.Types.ObjectId(userId),
            isRead: false,
        }).exec();
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map