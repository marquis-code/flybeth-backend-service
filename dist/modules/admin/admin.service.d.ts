import { Model, Types } from 'mongoose';
import { Booking } from '../bookings/schemas/booking.schema';
import { User } from '../users/schemas/user.schema';
import { Tenant } from '../tenants/schemas/tenant.schema';
import { Payment } from '../payments/schemas/payment.schema';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { BookingsService } from '../bookings/bookings.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class AdminService {
    private bookingModel;
    private userModel;
    private tenantModel;
    private paymentModel;
    private tenantsService;
    private usersService;
    private bookingsService;
    private readonly logger;
    constructor(bookingModel: Model<Booking>, userModel: Model<User>, tenantModel: Model<Tenant>, paymentModel: Model<Payment>, tenantsService: TenantsService, usersService: UsersService, bookingsService: BookingsService);
    getDashboard(): Promise<{
        overview: {
            totalTenants: number;
            activeTenants: number;
            totalUsers: number;
            totalBookings: number;
        };
        revenue: {
            byCurrency: any[];
            totalTransactions: any;
        };
        recentBookings: (import("mongoose").FlattenMaps<{
            pnr: string;
            user: Types.ObjectId;
            tenant: Types.ObjectId;
            package: Types.ObjectId;
            flights: {
                flight: Types.ObjectId;
                class: string;
                passengers: Types.ObjectId[];
            }[];
            stays: {
                stay: Types.ObjectId;
                room: Types.ObjectId;
                checkIn: Date;
                checkOut: Date;
                occupancy: {
                    rooms: number;
                    adults: number;
                    children: number;
                    childAges?: number[] | undefined;
                };
            }[];
            cars: {
                car: Types.ObjectId;
                pickUpDate: Date;
                dropOffDate: Date;
                pickUpLocation: string;
                dropOffLocation: string;
            }[];
            cruises: {
                cruise: Types.ObjectId;
                cabinType: string;
                departureDate: Date;
                passengers: Types.ObjectId[];
            }[];
            contactDetails: {
                email: string;
                phone: string;
                name: string;
            };
            pricing: {
                baseFare: number;
                taxes: number;
                fees: number;
                tenantMarkup: number;
                discount: number;
                totalAmount: number;
                currency: string;
                originalCurrency: string;
                originalAmount: number;
                exchangeRate: number;
            };
            payment: {
                status: import("../../common/constants/roles.constant").PaymentStatus;
                method: string;
                transactionId: string;
                provider: string;
                paidAt: Date;
            };
            status: import("../../common/constants/roles.constant").BookingStatus;
            cancellation: {
                reason: string;
                cancelledAt: Date;
                refundAmount: number;
                refundStatus: string;
            };
            expiresAt: Date;
            bookedAt: Date;
            notes: string;
            totalPassengers: number;
            isRoundTrip: boolean;
        }> & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getRevenue(period?: string, tenantId?: string): Promise<any[]>;
    getSystemHealth(): Promise<{
        status: string;
        timestamp: Date;
        lastHour: {
            bookings: number;
            payments: number;
            activeUsers: number;
        };
        uptime: number;
        memory: NodeJS.MemoryUsage;
    }>;
    getTenants(paginationDto: PaginationDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../tenants/schemas/tenant.schema").TenantDocument>>;
    getUsers(paginationDto: PaginationDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../users/schemas/user.schema").UserDocument>>;
    getBookings(paginationDto: PaginationDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../bookings/schemas/booking.schema").BookingDocument>>;
}
