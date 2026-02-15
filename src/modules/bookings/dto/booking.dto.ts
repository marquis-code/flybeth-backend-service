// src/modules/bookings/dto/booking.dto.ts
import {
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
    IsEmail,
    IsNumber,
    IsBoolean,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OccupancyDto } from '../../stays/dto/stays.dto';

class BookingStayDto {
    @ApiProperty({ description: 'Stay/Hotel ID' })
    @IsString()
    hotelId: string;

    @ApiProperty({ description: 'Room ID' })
    @IsString()
    roomId: string;

    @ApiProperty()
    @IsString()
    checkIn: string;

    @ApiProperty()
    @IsString()
    checkOut: string;

    @ApiProperty()
    @ValidateNested()
    @Type(() => OccupancyDto)
    occupancy: OccupancyDto;
}

class BookingCarDto {
    @ApiProperty()
    @IsString()
    carId: string;

    @ApiProperty()
    @IsString()
    pickUpDate: string;

    @ApiProperty()
    @IsString()
    dropOffDate: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    pickUpLocation?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    dropOffLocation?: string;
}

class BookingFlightDto {
    @ApiProperty({ description: 'Flight ID' })
    @IsString()
    flightId: string;

    @ApiProperty({ example: 'economy' })
    @IsString()
    class: string;

    @ApiProperty({ description: 'Array of passenger IDs' })
    @IsArray()
    @IsString({ each: true })
    passengerIds: string[];
}

class BookingCruiseDto {
    @ApiProperty()
    @IsString()
    cruiseId: string;

    @ApiProperty()
    @IsString()
    cabinType: string;

    @ApiProperty()
    @IsString()
    departureDate: string;

    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    passengerIds: string[];
}

class BookingContactDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '+1234567890' })
    @IsString()
    phone: string;

    @ApiPropertyOptional({ example: 'John Doe' })
    @IsOptional()
    @IsString()
    name?: string;
}

export class CreateBookingDto {
    @ApiPropertyOptional({ type: [BookingFlightDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BookingFlightDto)
    flights?: BookingFlightDto[];

    @ApiPropertyOptional({ type: [BookingStayDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BookingStayDto)
    stays?: BookingStayDto[];

    @ApiPropertyOptional({ type: [BookingCarDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BookingCarDto)
    cars?: BookingCarDto[];

    @ApiPropertyOptional({ type: [BookingCruiseDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BookingCruiseDto)
    cruises?: BookingCruiseDto[];

    @ApiProperty()
    @ValidateNested()
    @Type(() => BookingContactDto)
    contactDetails: BookingContactDto;

    @ApiPropertyOptional({ description: 'Tenant ID for B2B booking' })
    @IsOptional()
    @IsString()
    tenantId?: string;

    @ApiPropertyOptional({ description: 'Package ID if booking a bundle' })
    @IsOptional()
    @IsString()
    packageId?: string;

    @ApiPropertyOptional({ description: 'Currency for pricing', default: 'USD' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isRoundTrip?: boolean;
}

export class CancelBookingDto {
    @ApiProperty({ example: 'Change of plans' })
    @IsString()
    reason: string;
}

export class BookingQueryDto {
    @ApiPropertyOptional({ enum: ['pending', 'confirmed', 'ticketed', 'cancelled', 'refunded', 'expired'] })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tenantId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    endDate?: string;
}
