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
    const logoUrl = "https://res.cloudinary.com/marquis/image/upload/v1775916479/logo_aqftpd.png";
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          body { 
            margin: 0; 
            padding: 0; 
            width: 100% !important; 
            -webkit-text-size-adjust: 100%; 
            -ms-text-size-adjust: 100%; 
            background-color: #f1f5f9; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          
          .email-wrapper { 
            background-color: #f1f5f9; 
            padding: 60px 20px; 
            display: flex;
            justify-content: center;
          }
          
          .container { 
            background-color: #ffffff; 
            max-width: 600px; 
            width: 100%;
            margin: 0 auto; 
            border-radius: 24px; 
            padding: 0; 
            box-shadow: 0 40px 100px -20px rgba(13, 29, 173, 0.08); 
            border: 1px solid rgba(226, 232, 240, 1);
            overflow: hidden;
          }
          
          .top-bar {
            height: 6px;
            background: linear-gradient(90deg, #0D1DAD, #FF3D00);
          }
          
          .header { 
            padding: 50px 40px 30px; 
            text-align: center; 
            background-color: #ffffff;
          }
          
          .logo { 
            height: 48px; 
            width: auto; 
            margin-bottom: 30px; 
          }
          
          .hero-pill {
            display: inline-block;
            padding: 8px 16px;
            background-color: #eff6ff;
            border-radius: 100px;
            margin-bottom: 24px;
          }
          
          .hero-pill span {
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.15em;
          }
          
          .title { 
            color: #0D1DAD; 
            font-size: 32px; 
            font-weight: 800; 
            margin: 0; 
            letter-spacing: -0.04em; 
            line-height: 1.1; 
          }
          
          .body-content { 
            padding: 0 50px 50px; 
            font-size: 17px; 
            line-height: 1.8; 
            color: #334155; 
          }
          
          .body-content p { 
            margin-bottom: 24px; 
            color: #475569;
          }
          
          .body-content strong { 
            color: #0D1DAD; 
            font-weight: 700; 
          }
          
          .action-area { 
            text-align: center; 
            margin: 40px 0; 
          }
          
          .btn { 
            display: inline-block; 
            padding: 20px 40px; 
            background: linear-gradient(135deg, #0D1DAD 0%, #081163 100%);
            color: #ffffff !important; 
            text-decoration: none !important; 
            border-radius: 16px; 
            font-weight: 700; 
            font-size: 16px; 
            box-shadow: 0 20px 40px -10px rgba(13, 29, 173, 0.3);
            transition: all 0.3s ease;
          }
          
          .otp-card { 
            background: #f8fafc; 
            border-radius: 20px; 
            padding: 40px; 
            text-align: center; 
            margin: 40px 0; 
            border: 2px solid #e2e8f0; 
            position: relative;
          }
          
          .otp-label { 
            font-size: 12px; 
            font-weight: 800; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 0.2em; 
            margin-bottom: 16px; 
            display: block; 
          }
          
          .otp-code { 
            font-size: 48px; 
            font-weight: 900; 
            letter-spacing: 16px; 
            color: #0D1DAD; 
            font-family: 'Inter', monospace; 
            margin-left: 16px;
          }
          
          .footer { 
            text-align: center; 
            padding: 40px 50px;
            background-color: #f8fafc;
            border-top: 1px solid #f1f5f9;
          }
          
          .footer-brand { 
            font-weight: 800; 
            color: #0D1DAD; 
            margin-bottom: 12px; 
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 0.2em;
          }
          
          .footer-text { 
            font-size: 13px; 
            color: #94a3b8; 
            line-height: 1.8; 
            font-weight: 500;
          }
          
          .footer-text strong {
            color: #64748b;
          }
          
          .divider {
            height: 1px;
            background-color: #f1f5f9;
            margin: 40px 0;
          }

          @media only screen and (max-width: 620px) {
            .container { 
              border-radius: 0; 
              width: 100% !important; 
              max-width: 100% !important; 
            }
            .body-content { padding: 0 30px 40px; }
            .header { padding: 40px 30px 20px; }
            .title { font-size: 28px; }
            .otp-code { font-size: 36px; letter-spacing: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="top-bar"></div>
            <div class="header">
              <img src="${logoUrl}" alt="Flybeth Logo" class="logo" />
              <div class="hero-pill"><span>Official Notification</span></div>
              <h1 class="title">${title}</h1>
            </div>
            <div class="body-content">
              ${content}
            </div>
            <div class="footer">
              <div class="footer-brand">FLYBETH GLOBAL LLC</div>
              <div class="footer-text">
                1880 S Dairy Ashford Rd, Suite 207, Houston, TX 77077.<br>
                <strong>Toll Free:</strong> +1 844 FLYBETH (359-2384) • <strong>Email:</strong> Hello@flybeth.com<br>
                &copy; ${new Date().getFullYear()} • Elevating Every Journey together.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
