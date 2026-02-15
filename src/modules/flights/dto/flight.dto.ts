// src/modules/flights/dto/flight.dto.ts
import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    ValidateNested,
    IsEnum,
    IsDateString,
    IsBoolean,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlightClass, FlightStatus } from '../../../common/constants/roles.constant';

class AirportDetailDto {
    @ApiProperty({ example: 'JFK' })
    @IsString()
    airport: string;

    @ApiProperty({ example: 'New York' })
    @IsString()
    city: string;

    @ApiProperty({ example: 'United States' })
    @IsString()
    country: string;

    @ApiPropertyOptional({ example: 'T4' })
    @IsOptional()
    @IsString()
    terminal?: string;

    @ApiPropertyOptional({ example: 'G12' })
    @IsOptional()
    @IsString()
    gate?: string;

    @ApiProperty({ example: '2025-06-15T08:00:00Z' })
    @IsDateString()
    time: string;
}

class FlightClassDto {
    @ApiProperty({ enum: FlightClass })
    @IsEnum(FlightClass)
    type: FlightClass;

    @ApiProperty({ example: 350 })
    @IsNumber()
    @Min(0)
    basePrice: number;

    @ApiProperty({ example: 'USD' })
    @IsString()
    currency: string;

    @ApiProperty({ example: 150 })
    @IsNumber()
    @Min(0)
    seatsAvailable: number;

    @ApiPropertyOptional({ example: 200 })
    @IsOptional()
    @IsNumber()
    seatsTotal?: number;

    @ApiPropertyOptional({ example: '23kg checked + 7kg carry-on' })
    @IsOptional()
    @IsString()
    baggage?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    amenities?: string[];
}

export class CreateFlightDto {
    @ApiProperty({ example: 'Emirates' })
    @IsString()
    airline: string;

    @ApiProperty({ example: 'EK401' })
    @IsString()
    flightNumber: string;

    @ApiPropertyOptional({ example: 'Boeing 777-300ER' })
    @IsOptional()
    @IsString()
    aircraft?: string;

    @ApiProperty()
    @ValidateNested()
    @Type(() => AirportDetailDto)
    departure: AirportDetailDto;

    @ApiProperty()
    @ValidateNested()
    @Type(() => AirportDetailDto)
    arrival: AirportDetailDto;

    @ApiProperty({ example: 480, description: 'Duration in minutes' })
    @IsNumber()
    duration: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsNumber()
    stops?: number;

    @ApiProperty({ type: [FlightClassDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FlightClassDto)
    classes: FlightClassDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tenantId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({ example: ['MON', 'WED', 'FRI'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    operatingDays?: string[];
}

export class SearchFlightsDto {
    @ApiProperty({ example: 'JFK', description: 'Origin airport IATA code' })
    @IsString()
    origin: string;

    @ApiProperty({ example: 'LHR', description: 'Destination airport IATA code' })
    @IsString()
    destination: string;

    @ApiProperty({ example: '2025-06-15' })
    @IsDateString()
    departureDate: string;

    @ApiPropertyOptional({ example: '2025-06-22' })
    @IsOptional()
    @IsDateString()
    returnDate?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    adults?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    children?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    infantsOnLap?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    infantsInSeat?: number;

    @ApiPropertyOptional({ enum: FlightClass })
    @IsOptional()
    @IsEnum(FlightClass)
    class?: FlightClass;

    @ApiPropertyOptional({ description: 'Minimum price filter' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Maximum price filter' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxPrice?: number;

    @ApiPropertyOptional({ description: 'Filter by airline' })
    @IsOptional()
    @IsString()
    airline?: string;

    @ApiPropertyOptional({ description: 'Maximum stops (0 for direct)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxStops?: number;

    @ApiPropertyOptional({ enum: ['price', 'duration', 'departure', 'arrival'], default: 'price' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
    @IsOptional()
    @IsString()
    sortOrder?: string;

    @ApiPropertyOptional({ description: 'Currency for price display', default: 'USD' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;
}

export class UpdateFlightDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    aircraft?: string;

    @ApiPropertyOptional({ enum: FlightStatus })
    @IsOptional()
    @IsEnum(FlightStatus)
    status?: FlightStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FlightClassDto)
    classes?: FlightClassDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
