// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationType, NotificationChannel } from '../../common/constants/roles.constant';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        private configService: ConfigService,
    ) {
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

    async createNotification(params: {
        userId: string;
        tenantId?: string;
        type: NotificationType;
        title: string;
        message: string;
        data?: Record<string, any>;
        channel?: NotificationChannel;
    }): Promise<NotificationDocument> {
        const notification = new this.notificationModel({
            user: new Types.ObjectId(params.userId),
            tenant: params.tenantId ? new Types.ObjectId(params.tenantId) : null,
            type: params.type,
            title: params.title,
            message: params.message,
            data: params.data,
            channel: params.channel || NotificationChannel.IN_APP,
        });

        return notification.save();
    }

    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM'),
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent to: ${to} (${subject})`);
        } catch (error) {
            this.logger.error(`Email send failed: ${error.message}`);
        }
    }

    async sendBookingConfirmation(params: {
        email: string;
        pnr: string;
        firstName: string;
        totalAmount: number;
        currency: string;
        flightDetails: string;
    }): Promise<void> {
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

    async sendPaymentReceipt(params: {
        email: string;
        firstName: string;
        amount: number;
        currency: string;
        reference: string;
        pnr: string;
    }): Promise<void> {
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

    async getUserNotifications(
        userId: string,
        paginationDto: PaginationDto,
    ) {
        return paginate(
            this.notificationModel,
            { user: new Types.ObjectId(userId) },
            { ...paginationDto, sortBy: 'createdAt', sortOrder: 'desc' },
        );
    }

    async markAsRead(id: string): Promise<NotificationDocument | null> {
        return this.notificationModel
            .findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true })
            .exec();
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationModel.updateMany(
            { user: new Types.ObjectId(userId), isRead: false },
            { isRead: true, readAt: new Date() },
        ).exec();
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationModel.countDocuments({
            user: new Types.ObjectId(userId),
            isRead: false,
        }).exec();
    }
}
