// src/modules/payments/payments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Query,
  Headers,
  RawBodyRequest,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { PaymentsService } from "./payments.service";
import { InitializePaymentDto, RefundPaymentDto } from "./dto/payment.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Role } from "../../common/constants/roles.constant";
import { MongoIdValidationPipe } from "../../common/pipes/mongo-id-validation.pipe";
import { WebhookSignatureGuard } from "./bnpl/webhook-signature.guard";
import { PaymentProvider } from "../../common/constants/roles.constant";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post("initialize")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Initialize a payment for a booking" })
  initialize(
    @CurrentUser("_id") userId: string,
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePayment(userId, dto);
  }
  @Post("create-intent")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a Stripe PaymentIntent" })
  createIntent(
    @CurrentUser("_id") userId: string,
    @Body() body: { bookingId: string; currency: string },
  ) {
    return this.paymentsService.createPaymentIntent(
      userId,
      body.bookingId,
      body.currency,
    );
  }

  @Public()
  @Post("webhook/stripe")
  @ApiOperation({ summary: "Stripe webhook endpoint" })
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody!, signature);
  }

  @Public()
  @Post("webhook/paystack")
  @ApiOperation({ summary: "Paystack webhook endpoint" })
  handlePaystackWebhook(
    @Req() req: Request,
    @Headers("x-paystack-signature") signature: string,
  ) {
    const payload = JSON.stringify(req.body);
    return this.paymentsService.handlePaystackWebhook(payload, signature);
  }

  @Public()
  @Post("webhook/:gateway")
  @UseGuards(WebhookSignatureGuard)
  @ApiOperation({ summary: "Generic BNPL webhook endpoint" })
  handleBnplWebhook(
    @Param("gateway") gateway: PaymentProvider,
    @Body() payload: any,
    @Headers("x-webhook-signature") signature: string,
  ) {
    return this.paymentsService.handleBnplWebhook(gateway, payload, signature);
  }

  @Post("bnpl/authorize")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Authorize a BNPL transaction after redirect" })
  authorizeBnpl(
    @Body() dto: { bookingId: string; provider: PaymentProvider; checkoutToken: string; amount: number; currency: string }
  ) {
    return this.paymentsService.authorizeBnplPayment(dto);
  }

  @Public()
  @Get("bank-accounts")
  @ApiOperation({ summary: "Get active bank accounts for manual payment" })
  findBankAccounts(@Query("currency") currency?: string) {
    return this.paymentsService.getBanks(currency);
  }

  @Public()
  @Get("banks/paystack")
  @ApiOperation({ summary: "Get list of banks from Paystack" })
  getPaystackBanks() {
    return this.paymentsService.getPaystackBanks();
  }

  @Public()
  @Get("verify-account")
  @ApiOperation({ summary: "Verify a bank account" })
  verifyAccount(
    @Query("account_number") account_number: string,
    @Query("bank_code") bank_code: string,
  ) {
    return this.paymentsService.verifyBankAccount(account_number, bank_code);
  }

  @Get(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment by ID" })
  findOne(@Param("id", MongoIdValidationPipe) id: string) {
    return this.paymentsService.findById(id);
  }

  @Get("booking/:bookingId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payments for a booking" })
  findByBooking(@Param("bookingId", MongoIdValidationPipe) bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }

  @Post("refund/:paymentId")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Refund a payment" })
  refund(@Param("paymentId") paymentId: string, @Body() dto: RefundPaymentDto) {
    return this.paymentsService.refund(paymentId, dto);
  }
  @Post("wallet/topup")
  @ApiBearerAuth()
  @Roles(Role.AGENT, Role.CUSTOMER)
  @ApiOperation({ summary: "Initialize a wallet top-up session" })
  initializeTopUp(
    @CurrentUser("_id") userId: string,
    @CurrentUser("email") email: string,
    @Body() dto: { amount: number; currency: string; callbackUrl: string },
  ) {
    return this.paymentsService.initializeTopUp(userId, { ...dto, email });
  }
}
