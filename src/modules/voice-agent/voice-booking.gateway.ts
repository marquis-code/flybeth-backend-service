import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { AssemblyAIService } from "./assembly-ai.service";
import { VoiceBookingService } from "./voice-booking.service";
import { RealtimeTranscriber } from "assemblyai";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: "voice-booking",
  path: "/socket.io",
  transports: ["websocket", "polling"],
})
export class VoiceBookingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VoiceBookingGateway.name);
  private transcribers: Map<string, any> = new Map();

  constructor(
    private assemblyAIService: AssemblyAIService,
    private voiceBookingService: VoiceBookingService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.stopStreaming(client);
  }

  @SubscribeMessage("start-streaming")
  async startStreaming(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sampleRate?: number; token?: string },
  ) {
    const clientId = client.id;
    this.logger.log(`Starting stream for client: ${clientId}`);
    client.emit("debug-log", {
      message: "Backend: Initializing transcriber...",
    });

    let userId = null;
    if (data.token) {
      try {
        const payload = this.jwtService.verify(data.token);
        userId = payload.sub || payload.userId;
        this.logger.log(`Authenticated voice session for user: ${userId}`);
      } catch (err) {
        this.logger.warn(
          `Invalid token provided in voice session: ${err.message}`,
        );
      }
    }

    if (this.transcribers.has(clientId)) {
      this.logger.log(`Cleaning up existing transcriber for ${clientId}`);
      await this.stopStreaming(client);
    }

    try {
      const sampleRate = data.sampleRate || 16000;
      // Pass V3 configuration options
      const transcriber = this.assemblyAIService.createTranscriber({
        sampleRate,
        format_turns: true,
      });

      // Initialize the voice booking session for LLM context
      this.voiceBookingService.initSession(clientId, userId);

      transcriber.on("open", ({ id }) => {
        this.logger.log(
          `[AssemblyAI] Connection Opened: ${id} (Client: ${clientId})`,
        );
        client.emit("debug-log", {
          message: `Backend: AssemblyAI WebSocket opened: ${id}`,
        });

        // Signal frontend to start sending audio immediately on connect
        client.emit("session-opened", { id });
      });

      transcriber.on("session_begins", (data) => {
        this.logger.log(
          `[AssemblyAI] Session Begins: ${data.sessionId} (Client: ${clientId})`,
        );
        client.emit("debug-log", {
          message: `Backend: AssemblyAI session started: ${data.sessionId}`,
        });

        // Send welcome greeting as the first AI message
        client.emit("ai-response", {
          text: "Welcome to Flybeth Travels! Where would you like to go today?",
          action: "greeting",
        });
      });

      transcriber.on("error", (error) => {
        this.logger.error(
          `[AssemblyAI] Error (Client: ${clientId}): ${error.message}`,
        );
        client.emit("debug-log", {
          message: `Backend: AssemblyAI Error: ${error.message}`,
        });
        client.emit("error", { message: error.message });
      });

      transcriber.on("close", (code, reason) => {
        this.logger.log(
          `[AssemblyAI] Connection Closed (Client: ${clientId}): Code ${code}, Reason: ${reason}`,
        );
        client.emit("debug-log", {
          message: `Backend: AssemblyAI session closed: ${code} ${reason}`,
        });
        client.emit("session-closed", { code, reason });
      });

      // Handle V3 Turn-based results
      transcriber.on("turn", async (turn) => {
        if (!turn.transcript) return;

        this.logger.debug(
          `[AssemblyAI] Turn (Client: ${clientId}): ${turn.transcript} (End: ${turn.end_of_turn})`,
        );

        // Emit for real-time display
        client.emit("transcript", {
          text: turn.transcript,
          isFinal: turn.end_of_turn,
        });

        if (turn.end_of_turn) {
          try {
            const response = await this.voiceBookingService.processTranscript(
              clientId,
              turn.transcript,
            );
            if (response) {
              client.emit("ai-response", response);
            }
          } catch (error) {
            this.logger.error(
              `Error processing turn for ${clientId}: ${error.message}`,
            );
            client.emit("debug-log", {
              message: `Backend Error: ${error.message}`,
            });

            // Notify user through the AI chat that something went wrong
            client.emit("ai-response", {
              text: `I'm sorry, I'm having trouble with my brain right now: ${error.message}. Please try again.`,
              action: "reply",
            });
          }
        }
      });

      // Still listen to transcript for partials if needed, though turn provides 'end_of_turn'
      transcriber.on("transcript", (transcript) => {
        if (!transcript.text || transcript.message_type === "FinalTranscript")
          return;

        client.emit("transcript", {
          text: transcript.text,
          isFinal: false,
        });
      });

      this.logger.log(
        `[AssemblyAI] Attempting to connect... (Client: ${clientId})`,
      );
      client.emit("debug-log", {
        message: "Backend: Connecting to AssemblyAI WebSocket...",
      });

      await transcriber.connect();

      this.transcribers.set(clientId, transcriber);
      this.logger.log(
        `[AssemblyAI] Connected successfully! (Client: ${clientId})`,
      );
      client.emit("debug-log", {
        message: "Backend: AssemblyAI Connected. Handshaking...",
      });

      // Safety timeout: If session_begins doesn't fire in 8s, force a greeting as fallback
      setTimeout(() => {
        const currentTranscriber = this.transcribers.get(clientId);
        if (currentTranscriber && !currentTranscriber.sessionId) {
          this.logger.warn(
            `[AssemblyAI] Session begins timeout for ${clientId}. Forcing greeting fallback.`,
          );
          client.emit("debug-log", {
            message:
              "Backend: Warning - session_begins delayed. Sending fallback greeting.",
          });

          client.emit("ai-response", {
            text: "Welcome to Flybeth Travels! (Fallback) Where would you like to go today?",
            action: "greeting",
          });
        }
      }, 8000);
    } catch (error) {
      this.logger.error(`[AssemblyAI] Failed to connect: ${error.message}`);
      client.emit("debug-log", {
        message: `Backend: Connection failed: ${error.message}`,
      });
      client.emit("error", {
        message: "Failed to connect to transcription service",
      });
    }
  }

  @SubscribeMessage("audio-data")
  handleAudioData(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const transcriber = this.transcribers.get(client.id);
    if (transcriber) {
      try {
        // Ensure we handle various formats (Buffer, ArrayBuffer, Uint8Array)
        const audioBuffer = data instanceof Buffer ? data : Buffer.from(data);
        transcriber.sendAudio(audioBuffer);
      } catch (err) {
        this.logger.error(
          `Error sending audio for ${client.id}: ${err.message}`,
        );
      }
    }
  }

  @SubscribeMessage("stop-streaming")
  async stopStreaming(@ConnectedSocket() client: Socket) {
    const clientId = client.id;
    this.logger.log(`Stopping stream for client: ${clientId}`);
    client.emit("debug-log", { message: "Backend: Stopping stream" });

    const transcriber = this.transcribers.get(clientId);
    if (transcriber) {
      try {
        await transcriber.close();
      } catch (err) {
        this.logger.error(
          `Error closing transcriber for ${clientId}: ${err.message}`,
        );
      }
      this.transcribers.delete(clientId);
    }
    this.voiceBookingService.endSession(clientId);
  }
}
