import { Model } from 'mongoose';
import { BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto, CancelBookingDto, BookingQueryDto } from './dto/booking.dto';
import { FlightsService } from '../flights/flights.service';
import { TenantsService } from '../tenants/tenants.service';
import { StaysService } from '../stays/stays.service';
import { CarsService } from '../cars/cars.service';
import { CruisesService } from '../cruises/cruises.service';
import { PackagesService } from '../packages/packages.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/utils/pagination.util';
export declare class BookingsService {
    private bookingModel;
    private flightsService;
    private tenantsService;
    private staysService;
    private carsService;
    private cruisesService;
    private packagesService;
    private readonly logger;
    constructor(bookingModel: Model<BookingDocument>, flightsService: FlightsService, tenantsService: TenantsService, staysService: StaysService, carsService: CarsService, cruisesService: CruisesService, packagesService: PackagesService);
    create(userId: string, createBookingDto: CreateBookingDto): Promise<BookingDocument>;
    findById(id: string): Promise<BookingDocument>;
    findByPNR(pnr: string): Promise<BookingDocument>;
    findUserBookings(userId: string, paginationDto: PaginationDto, queryDto?: BookingQueryDto): Promise<PaginatedResult<BookingDocument>>;
    findTenantBookings(tenantId: string, paginationDto: PaginationDto, queryDto?: BookingQueryDto): Promise<PaginatedResult<BookingDocument>>;
    confirmBooking(bookingId: string): Promise<BookingDocument>;
    cancelBooking(id: string, userId: string, cancelDto: CancelBookingDto): Promise<BookingDocument>;
    expireBookings(): Promise<number>;
    getStats(tenantId?: string): Promise<{
        totalBookings: number;
        totalRevenue: any;
        byStatus: any;
    }>;
    getAllBookings(paginationDto: PaginationDto, queryDto?: BookingQueryDto): Promise<PaginatedResult<BookingDocument>>;
}
