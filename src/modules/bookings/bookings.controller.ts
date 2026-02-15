// src/modules/bookings/bookings.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, CancelBookingDto, BookingQueryDto } from './dto/booking.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/constants/roles.constant';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(RolesGuard)
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new booking' })
    create(
        @CurrentUser('_id') userId: string,
        @Body() createBookingDto: CreateBookingDto,
    ) {
        return this.bookingsService.create(userId, createBookingDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get current user bookings' })
    findMyBookings(
        @CurrentUser('_id') userId: string,
        @Query() paginationDto: PaginationDto,
        @Query() queryDto: BookingQueryDto,
    ) {
        return this.bookingsService.findUserBookings(userId, paginationDto, queryDto);
    }

    @Get('all')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all bookings (Super Admin)' })
    findAll(
        @Query() paginationDto: PaginationDto,
        @Query() queryDto: BookingQueryDto,
    ) {
        return this.bookingsService.getAllBookings(paginationDto, queryDto);
    }

    @Get('stats')
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
    @ApiOperation({ summary: 'Get booking statistics' })
    getStats(@Query('tenantId') tenantId?: string) {
        return this.bookingsService.getStats(tenantId);
    }

    @Get('reference/:pnr')
    @ApiOperation({ summary: 'Get booking by PNR reference' })
    findByPNR(@Param('pnr') pnr: string) {
        return this.bookingsService.findByPNR(pnr);
    }

    @Get('tenant/:tenantId')
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT)
    @ApiOperation({ summary: 'Get bookings for a tenant' })
    findTenantBookings(
        @Param('tenantId', MongoIdValidationPipe) tenantId: string,
        @Query() paginationDto: PaginationDto,
        @Query() queryDto: BookingQueryDto,
    ) {
        return this.bookingsService.findTenantBookings(tenantId, paginationDto, queryDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get booking by ID' })
    findOne(@Param('id', MongoIdValidationPipe) id: string) {
        return this.bookingsService.findById(id);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel a booking' })
    cancel(
        @Param('id', MongoIdValidationPipe) id: string,
        @CurrentUser('_id') userId: string,
        @Body() cancelDto: CancelBookingDto,
    ) {
        return this.bookingsService.cancelBooking(id, userId, cancelDto);
    }
}
