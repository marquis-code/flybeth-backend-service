import { Model } from 'mongoose';
import { PaymentDocument } from './schemas/payment.schema';
import { InitializePaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { StripeProvider } from './providers/stripe.provider';
import { PaystackProvider } from './providers/paystack.provider';
import { BookingsService } from '../bookings/bookings.service';
export declare class PaymentsService {
    private paymentModel;
    private stripeProvider;
    private paystackProvider;
    private bookingsService;
    private readonly logger;
    constructor(paymentModel: Model<PaymentDocument>, stripeProvider: StripeProvider, paystackProvider: PaystackProvider, bookingsService: BookingsService);
    private selectProvider;
    initializePayment(userId: string, dto: InitializePaymentDto): Promise<any>;
    handleStripeWebhook(payload: string | Buffer, signature: string): Promise<{
        received: boolean;
    }>;
    handlePaystackWebhook(payload: string, signature: string): Promise<{
        received: boolean;
    }>;
    private processSuccessfulPayment;
    private processFailedPayment;
    refund(paymentId: string, dto: RefundPaymentDto): Promise<any>;
    findById(id: string): Promise<PaymentDocument>;
    findByBooking(bookingId: string): Promise<PaymentDocument[]>;
}
