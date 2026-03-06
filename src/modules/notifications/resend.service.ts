// src/modules/notifications/resend.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    if (!apiKey) {
      this.logger.error(
        "RESEND_API_KEY is not defined in environment variables",
      );
    }
    this.resend = new Resend(apiKey);
  }

  async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }): Promise<any> {
    try {
      const from =
        params.from ||
        this.configService.get("SMTP_FROM") ||
        "Flybeth <onboarding@resend.dev>";

      this.logger.log(
        `Sending email via Resend to: ${params.to} (${params.subject})`,
      );

      const response = await this.resend.emails.send({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
      });

      if (response.error) {
        this.logger.error(
          `Resend email failed: ${JSON.stringify(response.error)}`,
        );
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error sending email via Resend: ${error.message}`);
      throw error;
    }
  }
}
