import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class VoiceAgentService {
  private readonly logger = new Logger(VoiceAgentService.name);

  constructor(private configService: ConfigService) {}

  async createSession() {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");

    if (!apiKey) {
      this.logger.warn(
        "OPENAI_API_KEY is missing. Returning a mock session key.",
      );
      return {
        client_secret: {
          value: "mock_session_key_for_development",
        },
      };
    }

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/realtime/sessions",
        {
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "alloy",
          instructions:
            "You are a helpful flight booking assistant for Flybeth. Help users find and book flights.",
          modalities: ["audio", "text"],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to create OpenAI session: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
