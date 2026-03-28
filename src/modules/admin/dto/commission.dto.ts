import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommissionDto {
  @ApiProperty({ example: 'DL' })
  @IsString()
  airlineCode: string;

  @ApiProperty({ enum: ['fixed', 'percentage'], default: 'fixed' })
  @IsEnum(['fixed', 'percentage'])
  type: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}
