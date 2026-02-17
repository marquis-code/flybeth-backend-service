// src/modules/voice-agent/voice-agent.controller.ts
import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    Req,
    UseInterceptors,
    UploadedFile,
    Delete,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { VoiceAgentService } from './voice-agent.service';
import { StartSessionDto, ProcessTextDto, ResumeSessionDto } from './dto/voice-agent.dto';

@ApiTags('Voice Agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice-agent')
export class VoiceAgentController {
    private readonly logger = new Logger(VoiceAgentController.name);

    constructor(private readonly voiceAgentService: VoiceAgentService) { }

    @Post('session')
    @ApiOperation({ summary: 'Start a new voice session' })
    async startSession(@Req() req: any, @Body() dto: StartSessionDto) {
        return this.voiceAgentService.startSession(req.user.userId, dto);
    }

    @Get('session/:id')
    @ApiOperation({ summary: 'Get session status' })
    async getSession(@Param('id') id: string) {
        return this.voiceAgentService.getSession(id);
    }

    @Post('session/:id/text')
    @ApiOperation({ summary: 'Process text input for a session' })
    async processText(
        @Param('id') id: string,
        @Body() dto: ProcessTextDto,
    ) {
        return this.voiceAgentService.processTextInput(id, dto);
    }

    @Post('session/:id/audio')
    @ApiOperation({ summary: 'Process audio input for a session' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async processAudio(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.voiceAgentService.processAudioInput(id, file.buffer);
    }

    @Post('session/:id/resume')
    @ApiOperation({ summary: 'Resume a paused session' })
    async resumeSession(
        @Param('id') id: string,
        @Body() dto: ResumeSessionDto,
    ) {
        // Implementation delegates to service
        return this.voiceAgentService.startSession(id, {}); // Re-start logic handles resume
    }

    @Delete('session/:id')
    @ApiOperation({ summary: 'End a session' })
    async endSession(@Param('id') id: string) {
        return this.voiceAgentService.endSession(id);
    }

    @Get('streaming-token')
    @ApiOperation({ summary: 'Get AssemblyAI streaming token' })
    async getStreamingToken() {
        // Expose token endpoint directly if needed by frontend independent of session
        const session = await this.voiceAgentService.startSession('anonymous', {});
        return { token: session.streamingToken };
    }
}
