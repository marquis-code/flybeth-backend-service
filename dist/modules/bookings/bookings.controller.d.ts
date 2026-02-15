import { BookingsService } from './bookings.service';
import { CreateBookingDto, CancelBookingDto, BookingQueryDto } from './dto/booking.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(userId: string, createBookingDto: CreateBookingDto): Promise<import("./schemas/booking.schema").BookingDocument>;
    findMyBookings(userId: string, paginationDto: PaginationDto, queryDto: BookingQueryDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./schemas/booking.schema").BookingDocument>>;
    findAll(paginationDto: PaginationDto, queryDto: BookingQueryDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./schemas/booking.schema").BookingDocument>>;
    getStats(tenantId?: string): Promise<{
        totalBookings: number;
        totalRevenue: any;
        byStatus: any;
    }>;
    findByPNR(pnr: string): Promise<import("./schemas/booking.schema").BookingDocument>;
    findTenantBookings(tenantId: string, paginationDto: PaginationDto, queryDto: BookingQueryDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./schemas/booking.schema").BookingDocument>>;
    findOne(id: string): Promise<import("./schemas/booking.schema").BookingDocument>;
    cancel(id: string, userId: string, cancelDto: CancelBookingDto): Promise<import("./schemas/booking.schema").BookingDocument>;
}
