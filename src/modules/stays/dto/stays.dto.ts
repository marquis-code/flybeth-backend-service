import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OccupancyDto {
    @IsNumber()
    @Min(1)
    rooms: number;

    @IsNumber()
    @Min(1)
    adults: number;

    @IsNumber()
    @IsOptional()
    children?: number;

    @IsArray()
    @IsOptional()
    childAges?: number[];
}

export class StaySearchDto {
    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsDateString()
    @IsOptional()
    checkIn?: string;

    @IsDateString()
    @IsOptional()
    checkOut?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => OccupancyDto)
    occupancy?: OccupancyDto;
}
