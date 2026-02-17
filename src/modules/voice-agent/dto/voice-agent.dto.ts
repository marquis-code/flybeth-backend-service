// src/modules/voice-agent/dto/voice-agent.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';

export class StartSessionDto {
    @ApiPropertyOptional({ description: 'Device or client metadata' })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Preferred language code (e.g., en, es, fr)' })
    @IsString()
    @IsOptional()
    language?: string;
}

export class ProcessTextDto {
    @ApiProperty({ description: 'User text input', example: 'I want to fly from Lagos to London on March 15' })
    @IsString()
    @IsNotEmpty()
    text: string;

    @ApiPropertyOptional({ description: 'Additional context' })
    @IsObject()
    @IsOptional()
    context?: Record<string, any>;
}

export class ProcessAudioDto {
    @ApiPropertyOptional({ description: 'Audio URL if pre-uploaded' })
    @IsString()
    @IsOptional()
    audioUrl?: string;

    @ApiPropertyOptional({ description: 'Transcription options' })
    @IsObject()
    @IsOptional()
    options?: Record<string, any>;
}

export class ResumeSessionDto {
    @ApiPropertyOptional({ description: 'Draft ID to resume from' })
    @IsString()
    @IsOptional()
    draftId?: string;
}

export class SupportQueryDto {
    @ApiProperty({ description: 'Support question or issue', example: 'How do I cancel my booking?' })
    @IsString()
    @IsNotEmpty()
    query: string;

    @ApiPropertyOptional({ description: 'Related booking ID' })
    @IsString()
    @IsOptional()
    bookingId?: string;

    @ApiPropertyOptional({ description: 'Context from previous interactions' })
    @IsObject()
    @IsOptional()
    context?: Record<string, any>;
}
