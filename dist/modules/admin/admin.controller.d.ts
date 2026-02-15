import { AdminService } from './admin.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
            user: import("mongoose").Types.ObjectId;
            tenant: import("mongoose").Types.ObjectId;
            package: import("mongoose").Types.ObjectId;
            flights: {
                flight: import("mongoose").Types.ObjectId;
                class: string;
                passengers: import("mongoose").Types.ObjectId[];
            }[];
            stays: {
                stay: import("mongoose").Types.ObjectId;
                room: import("mongoose").Types.ObjectId;
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
                car: import("mongoose").Types.ObjectId;
                pickUpDate: Date;
                dropOffDate: Date;
                pickUpLocation: string;
                dropOffLocation: string;
            }[];
            cruises: {
                cruise: import("mongoose").Types.ObjectId;
                cabinType: string;
                departureDate: Date;
                passengers: import("mongoose").Types.ObjectId[];
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
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    getRevenue(period?: string, tenantId?: string): Promise<any[]>;
    getTenants(paginationDto: PaginationDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../tenants/schemas/tenant.schema").TenantDocument>>;
    getUsers(paginationDto: PaginationDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../users/schemas/user.schema").UserDocument>>;
    getBookings(paginationDto: PaginationDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../bookings/schemas/booking.schema").BookingDocument>>;
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
}
