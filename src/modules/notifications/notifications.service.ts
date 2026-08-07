// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import * as nodemailer from "nodemailer";
import {
  Notification,
  NotificationDocument,
} from "./schemas/notification.schema";
import {
  EmailTemplate,
  EmailTemplateDocument,
} from "./schemas/email-template.schema";
import {
  NotificationType,
  NotificationChannel,
} from "../../common/constants/roles.constant";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { paginate } from "../../common/utils/pagination.util";
import { ResendService } from "./resend.service";
import { forwardRef, Inject } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import { NotificationsGateway } from "./notifications.gateway";
import { SystemConfigService } from "../system-config/system-config.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(EmailTemplate.name)
    private templateModel: Model<EmailTemplateDocument>,
    private configService: ConfigService,
    private resendService: ResendService,
    private systemConfigService: SystemConfigService,
    @InjectQueue("email-queue") private emailQueue: Queue,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

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

    const saved = await notification.save();

    // Broadcast to user in real-time
    this.chatGateway.sendNotificationToUser(params.userId, saved);

    return saved;
  }

  // --- Real-Time Admin Notifications ---

  emitBookingAttempt(data: any) {
    this.notificationsGateway.emitToAdmins('booking_attempt', {
      message: 'A user is attempting to create a booking.',
      data,
      timestamp: new Date(),
    });
  }

  emitBookingSuccess(data: any) {
    this.notificationsGateway.emitToAdmins('booking_success', {
      message: 'A booking was successfully completed.',
      data,
      timestamp: new Date(),
    });
  }

  emitBookingFailed(data: any) {
    this.notificationsGateway.emitToAdmins('booking_failed', {
      message: 'A booking or payment attempt failed.',
      data,
      timestamp: new Date(),
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    variables?: Record<string, any>,
    attachments?: Array<{ filename: string; content: Buffer }>,
  ): Promise<void> {
    try {
      await this.emailQueue.add(
        "send-email",
        {
          to,
          subject,
          html,
          variables,
          attachments,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
        },
      );
      this.logger.log(`Email job added to queue for: ${to}`);
    } catch (error) {
      this.logger.error(`Failed to add email to queue: ${error.message}`);
    }
  }

  async sendBookingConfirmation(params: {
    email: string;
    booking: any;
    attachments?: any[];
  }): Promise<void> {
    const { booking } = params;
    const pnr = booking.pnr;
    const firstName = booking.user?.firstName || booking.contactDetails?.name?.split(' ')[0] || 'Traveler';
    const lastName = booking.user?.lastName || booking.contactDetails?.name?.split(' ').slice(1).join(' ') || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    const totalAmount = booking.pricing?.totalAmount || 0;
    const baseAmount = booking.pricing?.baseAmount || totalAmount;
    const taxAmount = booking.pricing?.taxAmount || 0;
    const currency = booking.pricing?.currency || 'USD';
    const bookingDateStr = booking.createdAt 
      ? new Date(booking.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) 
      : 'Today';
    
    const manageUrl = `${this.configService.get("CLIENT_URL")}/bookings/${pnr}`;
    const logoUrl = this.configService.get("APP_LOGO_URL") || "https://res.cloudinary.com/marquis/image/upload/v1780815566/logo_dovk4t.png";
    
    // ── Payment Instructions generation ──
    let paymentInstructionsHtml = "";
    if (booking.paymentMethod === 'manual' || booking.paymentMethod === 'transfer' || booking.paymentStatus === 'pending') {
      const config = await this.systemConfigService.getConfig();
      const bankAccount = config.bankAccounts?.find(acc => acc.currency === currency) || config.bankAccounts?.[0];

      if (bankAccount) {
        paymentInstructionsHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
          <tr>
            <td class="px-mob" style="padding: 0 32px;">
              <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h3 style="margin: 0 0 12px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #92400E;">Action Required: Complete Your Payment</h3>
                <p style="margin: 0 0 16px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #B45309; line-height: 1.5;">Your booking is currently on hold. To confirm your ticket, please complete the bank transfer using the details below:</p>
                
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px; padding: 16px; border: 1px solid #FEF3C7;">
                  <tr>
                    <td style="padding: 4px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #92400E; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Bank Name</td>
                    <td align="right" style="padding: 4px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #1E3A8A; font-weight: 700;">${bankAccount.bankName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #92400E; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Account Name</td>
                    <td align="right" style="padding: 4px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #1E3A8A; font-weight: 700;">${bankAccount.accountName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #92400E; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Account Number</td>
                    <td align="right" style="padding: 4px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 18px; color: #1E3A8A; font-weight: 800; letter-spacing: 1px;">${bankAccount.accountNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #92400E; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Amount to Send</td>
                    <td align="right" style="padding: 4px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; color: #B45309; font-weight: 800;">${currency} ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </table>
                
                <div style="margin-top: 16px; padding: 12px; background-color: #FEF3C7; border-radius: 6px;">
                  <p style="margin: 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #92400E; font-weight: 600;">
                    &#9888; Important: <span style="font-weight: 400;">${bankAccount.instructions || `Please include your Booking Reference <strong>${pnr}</strong> in the transfer memo.`}</span>
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>`;
      }
    }

    // ── Flight data extraction ──
    const firstFlight = booking.flights && booking.flights[0];
    const isReturn = booking.isRoundTrip || 
                     (firstFlight?.metadata?.slices?.length > 1) || 
                     (firstFlight?.metadata?.itineraries?.length > 1) || 
                     (booking.flights && booking.flights.length > 1);
    const tripType = isReturn ? "Round Trip" : "One Way";
    const tripBadgeColor = isReturn ? "#6366F1" : "#0EA5E9";

    // ── Build flight slice cards ──
    let flightSlicesHtml = "";
    if (firstFlight?.metadata?.slices && firstFlight.metadata.slices.length > 0) {
      firstFlight.metadata.slices.forEach((slice: any, index: number) => {
        const firstSegment = slice.segments && slice.segments[0];
        const lastSegment = slice.segments && slice.segments[slice.segments.length - 1];
        
        const originCity = firstSegment?.origin?.city_name || firstSegment?.origin?.iata_city_code || firstFlight.metadata.origin || "Origin";
        const destCity = lastSegment?.destination?.city_name || lastSegment?.destination?.iata_city_code || firstFlight.metadata.destination || "Destination";
        const originCode = firstSegment?.origin?.iata_code || firstFlight.metadata.origin || "—";
        const destCode = lastSegment?.destination?.iata_code || firstFlight.metadata.destination || "—";
        
        const airline = firstSegment?.marketing_carrier?.name || firstFlight.metadata.airline || "Airline";
        const flightNum = firstSegment?.marketing_carrier_flight_number || "—";
        const cabinClass = firstFlight.class || "Economy";
        const departureTime = firstSegment?.departing_at || firstFlight.metadata.departureTime;
        const arrivalTime = lastSegment?.arriving_at;
        
        const formatFlightDateTime = (iso: string) => {
          if (!iso) return { date: "—", time: "—" };
          const d = new Date(iso);
          return {
            date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          };
        };
        
        const dep = formatFlightDateTime(departureTime);
        const arr = formatFlightDateTime(arrivalTime);
        const sliceLabel = isReturn ? (index === 0 ? "Outbound" : "Return") : `Flight ${index + 1}`;
        const stopsCount = slice.segments ? slice.segments.length - 1 : 0;
        const stopsLabel = stopsCount === 0 ? "Nonstop" : `${stopsCount} stop${stopsCount > 1 ? 's' : ''}`;

        flightSlicesHtml += `
          <!-- Flight Slice ${index + 1} -->
          ${index > 0 ? `<tr><td style="padding: 0 32px;"><div style="border-top: 1px dashed #E2E8F0; margin: 0;"></div></td></tr>` : ''}
          <tr>
            <td style="padding: ${index === 0 ? '28px' : '24px'} 32px 8px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: ${index === 0 ? '#EEF2FF' : '#FFF7ED'}; border-radius: 6px; padding: 4px 12px;">
                          <span style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: ${index === 0 ? '#4F46E5' : '#EA580C'}; letter-spacing: 0.5px; text-transform: uppercase;">${sliceLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #94A3B8;">
                    ${dep.date}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Route codes -->
          <tr>
            <td style="padding: 12px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="30%" valign="top">
                    <p style="margin: 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 800; color: #0F172A; line-height: 1; letter-spacing: -0.5px;">${originCode}</p>
                    <p style="margin: 4px 0 0 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #64748B; font-weight: 500;">${originCity}</p>
                    <p style="margin: 4px 0 0 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #0F172A; font-weight: 700;">${dep.time}</p>
                  </td>
                  <td width="40%" align="center" valign="middle" style="padding: 0 8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 10px; color: #94A3B8; font-weight: 600; letter-spacing: 0.5px; padding-bottom: 6px; text-transform: uppercase;">${stopsLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding: 0 4px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="8" style="font-size: 0;"><div style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid #6366F1;"></div></td>
                              <td style="border-top: 2px solid #E2E8F0; font-size: 0; line-height: 0;">&nbsp;</td>
                              <td width="24" align="center" style="font-size: 0;"><div style="color: #6366F1; font-size: 16px; margin-top: -2px;">&#9992;</div></td>
                              <td style="border-top: 2px solid #E2E8F0; font-size: 0; line-height: 0;">&nbsp;</td>
                              <td width="8" style="font-size: 0;"><div style="width: 8px; height: 8px; border-radius: 50%; background: #6366F1;"></div></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="30%" align="right" valign="top">
                    <p style="margin: 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 800; color: #0F172A; line-height: 1; letter-spacing: -0.5px;">${destCode}</p>
                    <p style="margin: 4px 0 0 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #64748B; font-weight: 500;">${destCity}</p>
                    <p style="margin: 4px 0 0 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #0F172A; font-weight: 700;">${arr.time}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Flight meta row -->
          <tr>
            <td style="padding: 16px 32px 20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border-radius: 10px; border: 1px solid #F1F5F9;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="33%" valign="top" style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
                          <p style="margin: 0; font-size: 10px; color: #94A3B8; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Airline</p>
                          <p style="margin: 3px 0 0 0; font-size: 13px; color: #1E293B; font-weight: 600;">${airline}</p>
                        </td>
                        <td width="33%" valign="top" style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
                          <p style="margin: 0; font-size: 10px; color: #94A3B8; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Flight</p>
                          <p style="margin: 3px 0 0 0; font-size: 13px; color: #1E293B; font-weight: 600;">${flightNum}</p>
                        </td>
                        <td width="34%" valign="top" style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
                          <p style="margin: 0; font-size: 10px; color: #94A3B8; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Class</p>
                          <p style="margin: 3px 0 0 0; font-size: 13px; color: #1E293B; font-weight: 600; text-transform: capitalize;">${cabinClass}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      });
    } else {
      // Fallback for bookings without slice data
      const originCode = firstFlight?.metadata?.origin || "—";
      const destCode = firstFlight?.metadata?.destination || "—";
      const airline = firstFlight?.metadata?.airline || "Airline";
      const cabinClass = firstFlight?.class || "Economy";
      
      flightSlicesHtml = `
        <tr>
          <td style="padding: 28px 32px 0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color: #EEF2FF; border-radius: 6px; padding: 4px 12px;">
                  <span style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #4F46E5; letter-spacing: 0.5px; text-transform: uppercase;">${tripType}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="35%" valign="top">
                  <p style="margin: 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 800; color: #0F172A; line-height: 1;">${originCode}</p>
                  <p style="margin: 4px 0 0 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #64748B;">Origin</p>
                </td>
                <td width="30%" align="center" valign="middle">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding: 0 4px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="8" style="font-size:0;"><div style="width:8px;height:8px;border-radius:50%;border:2px solid #6366F1;"></div></td>
                            <td style="border-top:2px solid #E2E8F0;font-size:0;line-height:0;">&nbsp;</td>
                            <td width="24" align="center" style="font-size:0;"><div style="color:#6366F1;font-size:16px;margin-top:-2px;">&#9992;</div></td>
                            <td style="border-top:2px solid #E2E8F0;font-size:0;line-height:0;">&nbsp;</td>
                            <td width="8" style="font-size:0;"><div style="width:8px;height:8px;border-radius:50%;background:#6366F1;"></div></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
                <td width="35%" align="right" valign="top">
                  <p style="margin: 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 800; color: #0F172A; line-height: 1;">${destCode}</p>
                  <p style="margin: 4px 0 0 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #64748B;">Destination</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 32px 24px 32px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #64748B;">
            ${airline} &bull; Class: <span style="text-transform: capitalize;">${cabinClass}</span>
          </td>
        </tr>`;
    }

    // ── Passenger rows ──
    let passengerHtml = `
      <tr>
        <td style="padding: 10px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size: 13px; color: #64748B;">1. ${fullName}</td>
              <td align="right" style="font-size: 12px; color: #94A3B8;">Adult</td>
            </tr>
          </table>
        </td>
      </tr>`;
    if (booking.passengerDetails && booking.passengerDetails.length > 0) {
      passengerHtml = booking.passengerDetails.map((p: any, i: number) => `
        <tr>
          <td style="padding: 8px 0; ${i < booking.passengerDetails.length - 1 ? 'border-bottom: 1px solid #F1F5F9;' : ''} font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size: 13px; color: #334155; font-weight: 500;">${i + 1}. ${(p.title || '').toUpperCase()} ${p.firstName || ''} ${p.lastName || ''}</td>
                <td align="right" style="font-size: 12px; color: #94A3B8; text-transform: capitalize;">${p.type || 'Adult'}</td>
              </tr>
            </table>
          </td>
        </tr>`).join('');
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Booking Confirmed — Flybeth Global</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #F1F5F9; }
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; }
    .px-mob { padding-left: 20px !important; padding-right: 20px !important; }
    .route-code { font-size: 26px !important; }
    .hero-title { font-size: 22px !important; }
    .price-big { font-size: 28px !important; }
    .stack-col { display: block !important; width: 100% !important; }
    .stack-col-right { padding-top: 12px !important; text-align: left !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F1F5F9; -webkit-font-smoothing: antialiased;">
<!-- Preheader -->
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Your flight is confirmed — reference ${pnr}. ${tripType} &#8226; ${firstName}, your booking details are inside.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
<tr>
<td align="center" style="padding: 32px 16px 40px 16px;">

  <!-- ═══ MAIN CONTAINER ═══ -->
  <table role="presentation" class="email-container" width="580" cellpadding="0" cellspacing="0" border="0" style="width:580px; max-width:580px;">

    <!-- Logo header -->
    <tr>
      <td align="center" style="padding: 0 0 24px 0;">
        <img src="${logoUrl}" alt="Flybeth Global" style="height: 32px; display: block;" />
      </td>
    </tr>

    <!-- ═══ CARD ═══ -->
    <tr>
      <td style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 32px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.04);">

        <!-- ── Gradient Header ── -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="px-mob" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%); padding: 32px 36px 28px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack-col" valign="top">
                    <!-- Status badge -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="background-color: rgba(74,222,128,0.15); border-radius: 20px; padding: 5px 14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width: 8px; height: 8px;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #4ADE80;"></div>
                              </td>
                              <td style="padding-left: 8px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #4ADE80; letter-spacing: 1px; text-transform: uppercase;">Confirmed &amp; Ticketed</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <!-- Greeting -->
                    <p class="hero-title" style="margin: 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 800; color: #FFFFFF; line-height: 1.2;">You're all set, ${firstName}!</p>
                    <p style="margin: 8px 0 0 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #94A3B8; line-height: 1.5;">Your flight has been booked and ticketed successfully.</p>
                  </td>
                  <td class="stack-col stack-col-right" width="140" align="right" valign="top" style="padding-top: 4px;">
                    <p style="margin: 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 10px; color: #64748B; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">Booking Ref</p>
                    <p style="margin: 4px 0 0 0; font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: 2px;">${pnr}</p>
                    <p style="margin: 8px 0 0 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; color: #64748B;">${bookingDateStr}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ── Trip Type + Flight Slices ── -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="px-mob" style="padding: 0 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; margin-top: 28px;">
                ${flightSlicesHtml}
              </table>
            </td>
          </tr>
        </table>

        <!-- ── Passenger Details ── -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="px-mob" style="padding: 28px 32px 0 32px;">
              <p style="margin: 0 0 12px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 1.5px; text-transform: uppercase;">Passengers</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${passengerHtml}
              </table>
            </td>
          </tr>
        </table>

        <!-- ── Payment Summary ── -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="px-mob" style="padding: 28px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 1.5px; text-transform: uppercase;">Payment Summary</td>
                  <td align="right">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: ${booking.paymentStatus === 'pending' ? '#FEF9C3' : '#F0FDF4'}; border-radius: 20px; padding: 4px 12px;">
                          <span style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; color: ${booking.paymentStatus === 'pending' ? '#CA8A04' : '#16A34A'}; font-weight: 700;">${booking.paymentStatus === 'pending' ? '&#8987; Pending' : '&#10003; Paid'}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid #F1F5F9;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #64748B;">Base fare</td>
                        <td align="right" style="padding: 6px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #334155; font-weight: 600;">${currency} ${baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #64748B;">Taxes &amp; surcharges</td>
                        <td align="right" style="padding: 6px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #334155; font-weight: 600;">${currency} ${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px dashed #E2E8F0; padding: 16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #0F172A; font-weight: 700;">Total due</td>
                        <td align="right">
                          <span class="price-big" style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; color: #0F172A;">${currency} ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ── Payment Instructions (For Manual Payments) ── -->
        ${paymentInstructionsHtml}

        <!-- ── Before You Fly ── -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="px-mob" style="padding: 28px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%); border-radius: 14px; border: 1px solid #E0E7FF;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #6366F1; letter-spacing: 1.5px; text-transform: uppercase;">Before You Fly</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="28" valign="top" style="padding-top: 1px;">
                          <div style="width: 24px; height: 24px; border-radius: 8px; background-color: #6366F1; color: #FFFFFF; text-align: center; font-size: 12px; line-height: 24px;">&#9200;</div>
                        </td>
                        <td style="padding-left: 14px; padding-bottom: 18px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
                          <p style="margin: 0; font-size: 14px; color: #1E293B; font-weight: 700;">Arrive early</p>
                          <p style="margin: 3px 0 0 0; font-size: 13px; color: #64748B; line-height: 1.5;">Plan to arrive at least 3 hours before your scheduled departure.</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="padding-top: 1px;">
                          <div style="width: 24px; height: 24px; border-radius: 8px; background-color: #6366F1; color: #FFFFFF; text-align: center; font-size: 12px; line-height: 24px;">&#128274;</div>
                        </td>
                        <td style="padding-left: 14px; padding-bottom: 18px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
                          <p style="margin: 0; font-size: 14px; color: #1E293B; font-weight: 700;">Check your passport</p>
                          <p style="margin: 3px 0 0 0; font-size: 13px; color: #64748B; line-height: 1.5;">Ensure it's valid for at least 6 months and review visa requirements.</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="padding-top: 1px;">
                          <div style="width: 24px; height: 24px; border-radius: 8px; background-color: #6366F1; color: #FFFFFF; text-align: center; font-size: 12px; line-height: 24px;">&#128179;</div>
                        </td>
                        <td style="padding-left: 14px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
                          <p style="margin: 0; font-size: 14px; color: #1E293B; font-weight: 700;">Download your invoice</p>
                          <p style="margin: 3px 0 0 0; font-size: 13px; color: #64748B; line-height: 1.5;">Your official PDF invoice is attached to this email for your records.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ── CTA Button ── -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" class="px-mob" style="padding: 28px 32px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius: 12px; background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); box-shadow: 0 4px 14px rgba(99,102,241,0.3);">
                    <a href="${manageUrl}" target="_blank" style="display: inline-block; padding: 15px 40px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; letter-spacing: 0.3px;">View Booking Details</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- ═══ FOOTER ═══ -->
    <tr>
      <td align="center" style="padding: 28px 24px 0 24px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.6;">Thank you for choosing <strong style="color: #334155;">Flybeth Global</strong></p>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #94A3B8;">Your official PDF invoice is attached to this email.</p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 24px 0 24px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 0 10px;"><a href="${manageUrl}" style="font-size: 12px; color: #6366F1; text-decoration: none; font-weight: 600;">Manage Booking</a></td>
            <td style="color: #CBD5E1; font-size: 12px;">&middot;</td>
            <td style="padding: 0 10px;"><a href="${this.configService.get("CLIENT_URL")}/help" style="font-size: 12px; color: #6366F1; text-decoration: none; font-weight: 600;">Help Center</a></td>
            <td style="color: #CBD5E1; font-size: 12px;">&middot;</td>
            <td style="padding: 0 10px;"><a href="${this.configService.get("CLIENT_URL")}" style="font-size: 12px; color: #6366F1; text-decoration: none; font-weight: 600;">flybeth.com</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 24px 0 24px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <p style="margin: 0; font-size: 11px; color: #CBD5E1;">FLYBETH GLOBAL LLC &bull; 1880 S Dairy Ashford Rd, Suite 207, Houston, TX 77077</p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #CBD5E1;">This is an automated message. Please do not reply directly to this email.</p>
      </td>
    </tr>

  </table>

</td>
</tr>
</table>

</body>
</html>`;

    await this.sendEmail(
      params.email,
      `Booking Confirmed: ${pnr} - Flybeth Global`,
      htmlContent,
      undefined,
      params.attachments
    );
  }


  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const template = await this.getTemplateBySlug('welcome-email');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'welcome-email',
        to: email,
        data: { firstName }
      });
      return;
    }

    const title = "Welcome to Flybeth!";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>We're delighted to welcome you to the Flybeth family! Our mission is to make every journey feel effortless and premium.</p>
      <div style="margin: 24px 0; background-color: var(--paper); border-radius: 12px; padding: 24px; border: 1px dashed var(--line);">
        <p style="margin: 0 0 8px 0; font-family: 'Fraunces', serif; font-weight: 600; font-size: 16px; color: var(--gold-deep);">Elite Inventory</p>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--slate); line-height: 1.6;">Unlock global rates for flights and luxury accommodation seamlessly synced to your account.</p>
        <p style="margin: 0 0 8px 0; font-family: 'Fraunces', serif; font-weight: 600; font-size: 16px; color: var(--gold-deep);">Seamless Design</p>
        <p style="margin: 0; font-size: 13px; color: var(--slate); line-height: 1.6;">Manage your entire travel ecosystem from a minimalist dashboard customized just for you.</p>
      </div>
      <div class="action-area">
        <a href="${this.configService.get("CLIENT_URL")}/search" class="btn">Discover Destinations</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "Welcome to Flybeth",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendOtpEmail(
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    const template = await this.getTemplateBySlug('otp-email');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'otp-email',
        to: email,
        data: { firstName, otp }
      });
      return;
    }

    const title = "Security Verification Code";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>To secure your digital session, please use the following one-time password (OTP) to complete your authentication to Flybeth.</p>
      
      <div style="position: relative; background: var(--paper); padding: 32px 24px; text-align: center; border-radius: 12px; border: 1px dashed var(--line); margin: 32px 0;">
        <span style="font-size: 10.5px; font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 2.5px; display: block; margin-bottom: 12px;">Verification Code</span>
        <span style="font-size: 40px; font-family: 'IBM Plex Mono', monospace; font-weight: 700; letter-spacing: 6px; color: var(--ink);">${otp}</span>
      </div>
      
      <p style="font-size: 12px; color: var(--slate); margin-top: 16px; line-height: 1.6;">This code expires in 10 minutes. Never share this PIN with anyone.</p>
    `;
    await this.sendEmail(
      email,
      `${otp} is your secure Flybeth sign-in code`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendResetPasswordEmail(
    email: string,
    firstName: string,
    token: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    // Choose correct base URL and path based on role
    let resetUrl = "";
    if (isAdmin) {
      const adminBaseUrl = this.configService.get("ADMIN_URL") || "http://localhost:3001";
      resetUrl = `${adminBaseUrl}/reset-password?token=${token}`;
    } else {
      const clientBaseUrl = this.configService.get("CLIENT_URL") || "http://localhost:4000";
      resetUrl = `${clientBaseUrl}/auth/reset-password?token=${token}`;
    }

    const template = await this.getTemplateBySlug('reset-password');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'reset-password',
        to: email,
        data: { firstName, resetUrl, token, isAdmin }
      });
      return;
    }

    const title = "Reset Your Password";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>We received a request to reset the password for your Flybeth account. To proceed with setting a new credential, please click the secure link below.</p>
      
      <div class="action-area">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      
      <div style="background: var(--paper); padding: 20px; border-radius: 12px; border: 1px dashed var(--line); margin-top: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 1.6px;">Trouble with the button?</p>
        <p style="margin: 0; font-size: 12px; color: var(--ink-soft); word-break: break-all; font-family: 'IBM Plex Mono', monospace;">${resetUrl}</p>
      </div>

      <p style="font-size: 12px; color: var(--slate); margin-top: 24px; line-height: 1.6;">If you did not request this, please ignore this message. Your account remains protected.</p>
    `;
    await this.sendEmail(
      email,
      "Password Reset Instructions - Flybeth",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAgentWelcomeEmail(email: string, firstName: string): Promise<void> {
    const title = "Welcome to the Flybeth Global Network";
    const content = `
      <p>Dearest <strong>${firstName}</strong>,</p>
      <p>I am thrilled to personally welcome your agency to the Flybeth Global Network. You are the bridge between explorers and the world, and we are here to amplify your brilliance.</p>
      <p>Our ecosystem is built for speed, precision, and profit. We recognize the immense value you bring, and we've built the tools to match it.</p>
      
      <div style="margin: 32px 0; background: var(--paper); border-radius: 12px; padding: 28px; border: 1px dashed var(--line);">
        <p style="margin: 0 0 20px 0; font-weight: 600; font-size: 11px; text-transform: uppercase; color: var(--slate); letter-spacing: 2px;">Commercial Advantage</p>
        <p style="margin: 0 0 4px 0; font-family: 'Fraunces', serif; font-weight: 600; font-size: 16px; color: var(--gold-deep);">Wholesale GDS Routing</p>
        <p style="margin: 0 0 20px 0; font-size: 13px; color: var(--slate); line-height: 1.6;">Access institutional flight APIs with automated mark-up logic and negotiated global airfares.</p>
        <p style="margin: 0 0 4px 0; font-family: 'Fraunces', serif; font-weight: 600; font-size: 16px; color: var(--gold-deep);">Automated Clearing</p>
        <p style="margin: 0; font-size: 13px; color: var(--slate); line-height: 1.6;">Transparent commission structures with direct settlement to your verified payout institution.</p>
      </div>

      <div style="margin-top: 32px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: var(--slate);">With boundless love and excitement,</p>
        <p style="margin: 0; font-family: 'Fraunces', serif; font-weight: 600; font-size: 18px; color: var(--ink);">Oluremi Oshinkoya</p>
        <p style="margin: 0; font-size: 12px; color: var(--gold-deep); letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">Founder & CEO, Flybeth</p>
      </div>
    `;

    await this.sendEmail(email, "A formal B2B welcome from our CEO", this.resendService.brandWrapper(title, content));
  }

  async sendAgentSignupUnderReviewEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    const title = "Application Under Review";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Thank you for registering your agency. We have successfully secured your onboarding pipeline data and compliance documents.</p>
      
      <div style="background: var(--paper); border-left: 4px solid var(--gold); padding: 20px; margin: 32px 0; border-radius: 0 12px 12px 0; border-top: 1px dashed var(--line); border-right: 1px dashed var(--line); border-bottom: 1px dashed var(--line);">
        <p style="color: var(--gold-deep); font-weight: 600; font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.6px; margin: 0 0 10px 0;">Internal Compliance Queue</p>
        <p style="margin: 0; color: var(--slate); font-size: 13.5px; line-height: 1.6;">Our global compliance team is reviewing your documentation. This typically takes 24-48 hours. We will notify you once cleared for commercial operations.</p>
      </div>

      <div class="action-area">
        <a href="http://agent.flybeth.com/auth/login" class="btn">Track Application Status</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "Your Flybeth B2B Profile is Under Review",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendKycDocumentApprovalEmail(
    email: string,
    firstName: string,
    documentType: string,
  ): Promise<void> {
    const title = "Compliance Verified";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Excellent progression! Our compliance division has successfully authenticated and approved your <strong>${documentType}</strong>.</p>
      
      <div style="background: var(--paper); border-left: 4px solid var(--green); padding: 20px; margin: 32px 0; border-radius: 0 12px 12px 0; border-top: 1px dashed var(--line); border-right: 1px dashed var(--line); border-bottom: 1px dashed var(--line);">
        <p style="margin: 0; color: var(--slate); font-size: 13.5px; line-height: 1.6;">Your identity documents have been cleared and securely stored. This moves you closer to unrestricted transactional capabilities.</p>
      </div>
    `;
    await this.sendEmail(
      email,
      `Verified: ${documentType} cleared by compliance`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendKycDocumentRejectionEmail(
    email: string,
    firstName: string,
    documentType: string,
    feedback: string,
  ): Promise<void> {
    const title = "Document Flagged";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>During a routine sweep, our compliance system flagged your submitted <strong>${documentType}</strong>. To proceed, we require a rapid correction.</p>
      
      <div style="background: var(--paper); border-left: 4px solid #b91c1c; padding: 20px; margin: 32px 0; border-radius: 0 12px 12px 0; border-top: 1px dashed var(--line); border-right: 1px dashed var(--line); border-bottom: 1px dashed var(--line);">
        <p style="color: #b91c1c; margin: 0 0 8px 0; font-size: 10.5px; text-transform: uppercase; font-weight: 600; letter-spacing: 1.6px;">Assessor Feedback</p>
        <p style="margin: 0; color: var(--ink); font-size: 14px; font-weight: 500;">"${feedback}"</p>
      </div>

      <div class="action-area">
        <a href="http://agent.flybeth.com/kyc" class="btn" style="background: #b91c1c; border-color: #7f1d1d;">Submit Correction</a>
      </div>
    `;
    await this.sendEmail(
      email,
      `Action Required: Failed verification on ${documentType}`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAgentApprovalEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    const title = "Deployment Authorized";
    const content = `
      <p>Congratulations <strong>${firstName}</strong>!</p>
      <p>Your partnership application has been rigorously analyzed and passed. <strong>Your agency is now live!</strong></p>
      
      <div style="background: var(--paper); border: 1px dashed var(--line); border-radius: 12px; padding: 28px; margin: 32px 0; text-align: center;">
        <p style="color: var(--slate); font-weight: 600; margin: 0 0 12px 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 2px;">Secure Access Key</p>
        <p style="color: var(--ink); font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 18px; margin: 0 0 12px 0; letter-spacing: 1px;">${email}</p>
        <p style="color: var(--slate); font-size: 12px; margin: 0; line-height: 1.6;">Access initialized with your registered security credentials.</p>
      </div>
      
      <div class="action-area">
        <a href="http://agent.flybeth.com/auth/login" class="btn">Initialize Dashboard</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "You are live! Full B2B platform unlocked.",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendTeamInvitationEmail(
    email: string,
    role: string,
    inviteUrl: string,
    expiresAt: string,
    permissions: string[] = [],
  ): Promise<void> {
    const title = "Welcome to the Flybeth Team";
    
    let permissionsHtml = "";
    if (permissions && permissions.length > 0) {
      permissionsHtml = `
        <p style="color: #4b5563; font-size: 13px; margin-top: 16px; margin-bottom: 8px;">Granted Permissions:</p>
        <ul style="color: #4b5563; font-size: 13px; padding-left: 20px; margin-bottom: 0; margin-top: 0;">
          ${permissions.map(p => `<li>${p.replace(/_/g, ' ')}</li>`).join('')}
        </ul>
      `;
    }

    const content = `
      <p>Congratulations!</p>
      <p>You have been invited to join the <strong>Flybeth Administrative Team</strong>. We are excited to bring you on board to help manage and scale our global travel operations.</p>
      
      <div style="background: var(--paper); border: 1px dashed var(--line); border-radius: 12px; padding: 24px; margin: 32px 0;">
        <p style="color: var(--slate); font-weight: 600; margin: 0 0 12px 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 2px;">Invitation Details</p>
        <p style="color: var(--ink); font-weight: 500; font-size: 14px; margin: 0 0 6px 0;">Assigned Access Level: <span style="text-transform: capitalize; color: var(--gold-deep); font-weight: 600;">${role.replace('_', ' ')}</span></p>
        <p style="color: #b91c1c; font-size: 12px; margin: 0;">Expires on ${expiresAt}</p>
        ${permissionsHtml}
      </div>
      
      <div class="action-area">
        <a href="${inviteUrl}" class="btn">Accept Invitation</a>
      </div>
      <p style="font-size: 12px; color: var(--slate); margin-top: 16px; line-height: 1.6;">If you're having trouble clicking the button, copy and paste this link: <br/><br/><code style="word-break: break-all; font-family: 'IBM Plex Mono', monospace;">${inviteUrl}</code></p>
    `;
    await this.sendEmail(
      email,
      "You've been invited to join the Flybeth Admin Team",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendRoleUpdateEmail(
    email: string,
    roleName: string,
    permissions: string[],
  ): Promise<void> {
    const title = "Permissions Updated";
    
    let permissionsHtml = "";
    if (permissions && permissions.length > 0) {
      permissionsHtml = `
        <ul style="color: #4b5563; font-size: 13px; padding-left: 20px; margin-bottom: 0; margin-top: 0;">
          ${permissions.map(p => `<li>${p.replace(/_/g, ' ')}</li>`).join('')}
        </ul>
      `;
    } else {
      permissionsHtml = `<p style="color: #4b5563; font-size: 13px; margin: 0;">Your role currently has no active permissions.</p>`;
    }

    const content = `
      <p>Your access permissions for the role <strong>${roleName.replace(/_/g, ' ')}</strong> have been updated by an administrator.</p>
      
      <div style="background: var(--paper); border: 1px dashed var(--line); border-radius: 12px; padding: 24px; margin: 32px 0;">
        <p style="color: var(--slate); font-weight: 600; margin: 0 0 12px 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 2px;">Current Permissions</p>
        ${permissionsHtml}
      </div>
      
      <div class="action-area">
        <a href="http://admin.flybeth.com/login" class="btn">Login to Dashboard</a>
      </div>
    `;
    
    await this.sendEmail(
      email,
      "Your Flybeth Permissions have been updated",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendInvitationReminderEmail(
    email: string,
    inviteUrl: string,
  ): Promise<void> {
    const title = "Your Invitation is Expiring Soon!";
    const content = `
      <p>Action Required</p>
      <p>This is a quick reminder that your invitation to join the <strong>Flybeth Administrative Team</strong> will expire soon.</p>
      <p>Please click the secure link below to accept the invitation and set up your administrative credentials before it expires.</p>
      
      <div class="action-area">
        <a href="${inviteUrl}" class="btn" style="background: #b91c1c;">Accept Invitation Now</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "Action Required: Your Flybeth Team Invitation is expiring soon",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAbandonedBookingReminder(params: {
    email: string;
    firstName: string;
    itemType: "flight" | "stay";
    itemName: string;
    url: string;
  }): Promise<void> {
    const title = "Incomplete Journey";
    const content = `
      <p>Hi <strong>${params.firstName}</strong>,</p>
      <p>Our engine noticed you paused your selection for <strong>${params.itemName}</strong>. Don't let your perfect trip slip away.</p>
      
      <div style="background: var(--paper); border-left: 4px solid var(--gold); border-radius: 0 12px 12px 0; border-top: 1px dashed var(--line); border-right: 1px dashed var(--line); border-bottom: 1px dashed var(--line); padding: 20px; margin: 32px 0;">
        <p style="color: var(--gold-deep); font-weight: 600; margin: 0 0 8px 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.6px;">Dynamic Pricing Alert</p>
        <p style="color: var(--ink); font-size: 13.5px; margin: 0; line-height: 1.6;">We've temporarily locked this rate for you. Secure it now before it resets.</p>
      </div>
      
      <div class="action-area">
        <a href="${params.url}" class="btn">Resume My Booking</a>
      </div>
    `;
    await this.sendEmail(
      params.email,
      `Action Needed: Finalize your ${params.itemType} before pricing resets`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendPaymentReceipt(params: {
    email: string;
    firstName: string;
    amount: number;
    currency: string;
    reference: string;
    pnr: string;
  }): Promise<void> {
    const title = "Payment Successful";
    const content = `
      <p>Dear <strong>${params.firstName}</strong>,</p>
      <p>We have securely cleared your payment request. Your transaction details are recorded below for your records.</p>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Authorized Amount</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 700;">${params.currency} ${params.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Transaction Ref</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-family: monospace;">${params.reference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Booking ID (PNR)</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${params.pnr}</td>
          </tr>
          <tr style="border-top: 1px dashed #d1d5db;">
            <td style="padding: 16px 0 0; color: #4b5563; font-weight: 500;">Timestamp</td>
            <td style="padding: 16px 0 0; text-align: right; color: #111827;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>
    `;

    await this.sendEmail(
      params.email,
      `Payment Receipt Confirmed - ${params.reference}`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async getUserNotifications(userId: string, paginationDto: PaginationDto) {
    return paginate(
      this.notificationModel,
      { user: new Types.ObjectId(userId) },
      { ...paginationDto, sortBy: "createdAt", sortOrder: "desc" },
    );
  }

  async markAsRead(id: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findByIdAndUpdate(
        id,
        { isRead: true, readAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { user: new Types.ObjectId(userId), isRead: false },
        { isRead: true, readAt: new Date() },
      )
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({
        user: new Types.ObjectId(userId),
        isRead: false,
      })
      .exec();
  }

  // --- Email Template Methods ---

  async getTemplates(tenantId?: string): Promise<EmailTemplateDocument[]> {
    const filter: any = {};
    if (tenantId) filter.tenant = new Types.ObjectId(tenantId);
    return this.templateModel.find(filter).sort({ name: 1 }).exec();
  }

  async getTemplateBySlug(
    slug: string,
    tenantId?: string,
  ): Promise<EmailTemplateDocument | null> {
    const filter: any = { slug };
    if (tenantId) filter.tenant = new Types.ObjectId(tenantId);
    return this.templateModel.findOne(filter).exec();
  }

  async getTemplateById(id: string): Promise<EmailTemplateDocument | null> {
    return this.templateModel.findById(id).exec();
  }

  async createTemplate(data: any): Promise<EmailTemplateDocument> {
    const template = new this.templateModel(data);
    return template.save();
  }

  async updateTemplate(
    id: string,
    data: any,
  ): Promise<EmailTemplateDocument | null> {
    return this.templateModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateModel.findByIdAndDelete(id).exec();
  }

  /**
   * Replaces {{variable}} placeholders with actual data
   * @deprecated Use this.resendService.replaceVariables instead
   */
  private compileTemplate(html: string, data: Record<string, any>): string {
    return this.resendService.replaceVariables(html, data);
  }

  async sendDynamicEmail(params: {
    slug: string;
    to: string;
    data: Record<string, any>;
    tenantId?: string;
    attachments?: any[];
  }): Promise<void> {
    const template = await this.getTemplateBySlug(params.slug, params.tenantId);
    if (!template) {
      this.logger.error(`Email template with slug "${params.slug}" not found`);
      return;
    }

    const htmlContent = this.resendService.replaceVariables(
      template.htmlContent,
      params.data,
    );
    const subject = this.resendService.replaceVariables(
      template.subject,
      params.data,
    );

    // Wrap in branding if not a full HTML document
    const finalHtml = htmlContent.includes("<html")
      ? htmlContent
      : this.resendService.brandWrapper(subject, htmlContent);

    await this.sendEmail(params.to, subject, finalHtml, {}, params.attachments);
  }

    async seedDefaultTemplates(): Promise<void> {
    const baseStyle = `body { margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, sans-serif; }
    .email-wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; color: #333333; }
    .logo { margin-bottom: 30px; font-weight: bold; font-size: 20px; color: #111827; }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #111827; }
    .text { font-size: 14px; line-height: 1.5; color: #4b5563; margin-bottom: 20px; text-align: left; }
    .btn { display: inline-block; background-color: #111827; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 14px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
    .footer a { color: #111827; text-decoration: none; font-weight: 500; }
    .box { background: #f9fafb; padding: 20px; border-radius: 6px; text-align: left; margin-bottom: 20px; }
    .box p { margin: 0 0 10px 0; font-size: 14px; }
    .box p:last-child { margin: 0; }`;

    const getHtml = (innerContent) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>${baseStyle}</style></head>
<body>
  <div class="email-wrapper">
    <div class="logo">Flybeth</div>
    ${innerContent}
    <div class="footer">
      <p>Looking for your next adventure?</p>
      <a href="${this.configService.get("CLIENT_URL") || 'https://flybeth.com'}">Visit Flybeth to perform other bookings</a>
    </div>
  </div>
</body>
</html>`;

    const defaults = [
      {
        slug: "booking-capture-draft",
        name: "Flight Booking Capture",
        subject: "Finish your flight to {{destination}}",
        htmlContent: getHtml(`
          <div class="title">Finish your flight to {{destination}}</div>
          <p class="text">Seats and prices don't stick around for long. If you still want this trip, now's a good time to lock it in.</p>
          <div class="box">
            <p><strong>Passenger:</strong> {{firstName}}</p>
            <p><strong>Destination:</strong> {{destination}}</p>
          </div>
          <a href="{{checkoutUrl}}" class="btn">Complete your booking</a>
        `),
        availableVariables: ["firstName", "destination", "checkoutUrl"],
      },
      {
        slug: "payment-reminder",
        name: "Payment Reminder",
        subject: "Secure your ticket for {{pnr}}",
        htmlContent: getHtml(`
          <div class="title">Action Required, {{firstName}}</div>
          <p class="text">Your booking is currently pending final settlement. Please complete your payment to secure your seat and current price.</p>
          <div class="box">
            <p><strong>Booking Reference:</strong> {{pnr}}</p>
          </div>
          <a href="{{paymentUrl}}" class="btn">Secure Ticket Now</a>
        `),
        availableVariables: ["firstName", "pnr", "paymentUrl"],
      },
      {
        slug: "welcome-email",
        name: "Welcome to Flybeth",
        subject: "Welcome to Flybeth, {{firstName}}",
        htmlContent: getHtml(`
          <div class="title">Welcome aboard, {{firstName}}!</div>
          <p class="text">We're delighted to welcome you to the Flybeth family. Access exclusive rates and manage your entire travel ecosystem from our customized dashboard.</p>
          <a href="{{loginUrl}}" class="btn">Explore Destinations</a>
        `),
        availableVariables: ["firstName", "loginUrl"],
      },
      {
        slug: "password-reset",
        name: "Password Reset",
        subject: "Reset your Flybeth password",
        htmlContent: getHtml(`
          <div class="title">Reset your password</div>
          <p class="text">Hello {{firstName}}, we received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="{{resetUrl}}" class="btn">Reset Password</a>
          <p class="text" style="font-size: 12px; color: #9ca3af; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
        `),
        availableVariables: ["firstName", "resetUrl"],
      },
      {
        slug: "booking-confirmation",
        name: "E-Ticket & Booking Confirmation",
        subject: "Your E-Ticket for {{destination}} is ready!",
        htmlContent: getHtml(`
          <div class="title">Booking Confirmed!</div>
          <p class="text">Hi {{firstName}}, your payment was successful and your e-ticket has been issued for your trip to {{destination}}.</p>
          <div class="box">
            <p><strong>Booking Reference (PNR):</strong> {{pnr}}</p>
            <p><strong>Passenger:</strong> {{firstName}} {{lastName}}</p>
            <p><strong>Total Paid:</strong> {{currency}} {{amount}}</p>
          </div>
          <a href="{{manageUrl}}" class="btn">Manage Booking</a>
        `),
        availableVariables: ["firstName", "lastName", "destination", "pnr", "currency", "amount", "manageUrl"],
      },
    ];

    for (const t of defaults) {
      await this.templateModel.findOneAndUpdate({ slug: t.slug }, t, {
        upsert: true,
        new: true,
      });
    }
    this.logger.log("Default email templates seeded");
  }
}
