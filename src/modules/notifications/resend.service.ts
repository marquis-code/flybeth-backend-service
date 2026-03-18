// src/modules/notifications/resend.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private resend: Resend;
  private readonly defaultFrom: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    if (!apiKey) {
      this.logger.error(
        "RESEND_API_KEY is not defined in environment variables",
      );
    }
    this.resend = new Resend(apiKey);
    this.defaultFrom =
      this.configService.get<string>("SMTP_FROM") ||
      "Flybeth <onboarding@resend.dev>";
  }

  async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    text?: string;
    variables?: Record<string, any>;
  }): Promise<any> {
    try {
      const from = params.from || this.defaultFrom;
      let finalHtml = params.html;
      let finalSubject = params.subject;

      // Handle variable replacement if variables are provided
      if (params.variables) {
        finalHtml = this.replaceVariables(finalHtml, params.variables);
        finalSubject = this.replaceVariables(finalSubject, params.variables);
      }

      const finalText = params.text || this.stripHtml(finalHtml);

      this.logger.log(
        `Sending email via Resend to: ${params.to} (${finalSubject}) from: ${from}`,
      );

      const response = await this.resend.emails.send({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
      });

      if (response.error) {
        this.logger.error(
          `Resend email failed for address ${from}: ${JSON.stringify(response.error)}`,
        );

        // Fallback logic for unverified domains during development
        if (
          from !== "onboarding@resend.dev" &&
          (response.error.name === "validation_error" ||
            response.error.name === "application_error")
        ) {
          this.logger.warn(
            `Attempting resilient fallback to onboarding@resend.dev due to: ${response.error.name}`,
          );
          return this.sendEmail({ ...params, from: "onboarding@resend.dev" });
        }

        throw new Error(
          response.error.message || "Resend API returned an unspecified error",
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error sending email via Resend: ${error.message}`);
      throw error;
    }
  }

  public replaceVariables(text: string, variables: any): string {
    if (!variables) return text;
    return text.replace(/\{\{\s*(.*?)\s*\}\}/g, (match, key) => {
      return variables[key.trim()] !== undefined
        ? variables[key.trim()]
        : match;
    });
  }

  public stripHtml(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "").trim();
  }

  /**
   * Flybeth Brand Wrapper for emails
   */
  public brandWrapper(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@400;600;800&display=swap');
          
          body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', 'Outfit', -apple-system, sans-serif; }
          .email-wrapper { background-color: #f8fafc; padding: 40px 15px; }
          .container { 
            background-color: #ffffff; 
            max-width: 580px; 
            margin: 0 auto; 
            border-radius: 24px; 
            padding: 48px 40px; 
            box-shadow: 0 20px 50px rgba(13, 29, 173, 0.05); 
            border: 1px solid #e2e8f0;
          }
          .logo { text-align: center; margin-bottom: 40px; }
          .logo-text { 
            font-size: 28px; 
            font-weight: 900; 
            color: #0D1DAD; 
            letter-spacing: -0.05em; 
            text-transform: uppercase;
          }
          .logo-text span { color: #FF3D00; }
          
          .header { text-align: center; margin-bottom: 32px; }
          .title-pill {
            display: inline-block;
            padding: 8px 16px;
            background: #eff6ff;
            border-radius: 100px;
            margin-bottom: 16px;
          }
          .title-pill span {
            color: #0d47a1;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .title { color: #0D1DAD; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.03em; line-height: 1.2; }
          
          .content { font-size: 16px; line-height: 1.7; color: #475569; margin-bottom: 40px; }
          .content p { margin-bottom: 20px; }
          .content strong { color: #0D1DAD; font-weight: 600; }
          
          .action-area { text-align: center; margin: 40px 0; }
          .btn { 
            display: inline-block; 
            padding: 18px 36px; 
            background: linear-gradient(135deg, #FF3D00 0%, #D32F2F 100%);
            color: #ffffff !important; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: 700; 
            font-size: 16px; 
            box-shadow: 0 12px 24px -6px rgba(255, 61, 0, 0.3);
          }
          
          .otp-card { 
            background: #f1f5f9; 
            border-radius: 16px; 
            padding: 32px; 
            text-align: center; 
            margin: 32px 0; 
            border: 2px dashed #0D1DAD; 
          }
          .otp-label { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px; display: block; }
          .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #0D1DAD; font-family: 'Outfit', monospace; }
          
          .footer { 
            text-align: center; 
            padding: 32px 0 0;
            border-top: 1px solid #f1f5f9;
            margin-top: 40px;
          }
          .footer-text { font-size: 13px; color: #94a3b8; line-height: 1.6; }
          .footer-brand { font-weight: 800; color: #0D1DAD; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="logo">
              <div class="logo-text">Fly<span>beth</span></div>
            </div>
            <div class="header">
              <div class="title-pill"><span>Security Notification</span></div>
              <h1 class="title">${title}</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <div class="footer-brand">Flybeth Travel</div>
              <div class="footer-text">
                &copy; ${new Date().getFullYear()} • Elevating Every Journey.<br>
                Premium Travel Experience.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
