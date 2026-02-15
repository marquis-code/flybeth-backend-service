// src/modules/payments/dto/payment.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitializePaymentDto {
    @ApiProperty({ description: 'Booking ID to pay for' })
    @IsString()
    bookingId: string;

    @ApiProperty({ example: 'USD', description: 'Payment currency' })
    @IsString()
    currency: string;

    @ApiPropertyOptional({ description: 'Success callback URL' })
    @IsOptional()
    @IsString()
    callbackUrl?: string;

    @ApiPropertyOptional({ description: 'Force specific provider', enum: ['stripe', 'paystack'] })
    @IsOptional()
    @IsEnum(['stripe', 'paystack'])
    provider?: string;
}

export class RefundPaymentDto {
    @ApiPropertyOptional({ description: 'Partial refund amount (defaults to full)' })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiProperty({ example: 'Customer requested cancellation' })
    @IsString()
    reason: string;
}
