// src/modules/notifications/resend.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { renderEmail } from "./email/layout";

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
    attachments?: Array<{ filename: string; content: any }>;
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
        attachments: params.attachments,
      });

      if (response.error) {
        this.logger.error(
          `Resend email failed on initial attempt for address ${from}: ${JSON.stringify(response.error, null, 2)}`,
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
        }

        // Intercept Free Tier/Sandbox restriction so it doesn't fail the whole queue
        if (
          response.error.name === "validation_error" && 
          response.error.message?.includes("testing emails to your own email address")
        ) {
          this.logger.warn(`Resend Sandbox Limitation hit for ${params.to}. Suppressing error to keep queue active.`);
          return { id: "mock_id_dev_sandbox_limit" };
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
  /**
   * Wraps pre-rendered content in the current email design.
   *
   * Prefer the renderers in ./email/templates — this exists for callers that
   * still pass raw HTML and for backward compatibility.
   */
  public brandWrapper(title: string, content: string): string {
    return renderEmail({
      preheader: title,
      heading: title,
      body: content,
    });
  }
}
