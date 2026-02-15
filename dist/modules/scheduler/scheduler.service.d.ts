import { BookingsService } from '../bookings/bookings.service';
import { CurrencyService } from '../currency/currency.service';
export declare class SchedulerService {
    private bookingsService;
    private currencyService;
    private readonly logger;
    constructor(bookingsService: BookingsService, currencyService: CurrencyService);
    expirePendingBookings(): Promise<void>;
    refreshExchangeRates(): Promise<void>;
}
