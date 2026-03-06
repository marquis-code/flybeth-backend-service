import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AssemblyAI, RealtimeTranscriber } from "assemblyai";

@Injectable()
export class AssemblyAIService {
  private readonly logger = new Logger(AssemblyAIService.name);
  private client: AssemblyAI;

  constructor(private configService: ConfigService) {
    let apiKey = this.configService.get<string>("ASSEMBLYAI_API_KEY");
    if (!apiKey) {
      throw new Error(
        "ASSEMBLYAI_API_KEY is missing from environment variables",
      );
    }
    // Strip quotes if present
    apiKey = apiKey.replace(/^["'](.+)["']$/, "$1");

    this.client = new AssemblyAI({ apiKey });
    this.logger.log(
      `AssemblyAI client initialized with key length: ${apiKey.length}`,
    );
  }

  createTranscriber(
    options: {
      sampleRate?: number;
      format_turns?: boolean;
      keyterms_prompt?: string[];
    } = {},
  ): any {
    const rate = options.sampleRate || 16000;
    return this.client.streaming.transcriber({
      sampleRate: rate,
      sample_rate: rate, // Add explicit snake_case for V3 API compatibility
      format_turns: options.format_turns ?? true, // Default to true for better UI results
      // Note: The SDK maps camelCase to snake_case for the API
      ...options,
    } as any);
  }
}
