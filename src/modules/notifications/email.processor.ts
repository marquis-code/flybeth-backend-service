import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { Logger } from "@nestjs/common";
import { ResendService } from "./resend.service";

@Processor("email-queue")
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly resendService: ResendService) {}

  @Process("send-email")
  async handleSendEmail(job: Job) {
    this.logger.log(`Processing email job: ${job.id}`);
    const { to, subject, html, variables, attachments } = job.data;

    try {
      await this.resendService.sendEmail({ to, subject, html, variables, attachments });
      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed: ${error.message}`);
      throw error; // Bull will retry based on config
    }
  }
}
