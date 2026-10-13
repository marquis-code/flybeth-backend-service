import { IsEmail, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Payload sent by the admin portal's "manual record entry" modal
 * (`admin/pages/dashboard/bookings/index.vue` → `newBooking`):
 *   { customer, email, type, date, amount }
 *
 * It is intentionally narrower than `CreateBookingDto` — a manual ledger entry
 * has no supplier line items, so the admin supplies the customer, the service
 * type/date and the settlement amount directly.
 */
export class CreateAdminBookingDto {
  @ApiProperty({ example: "John Doe", description: "Customer name" })
  @IsString()
  customer: string;

  @ApiProperty({ example: "john@example.com", description: "Customer email" })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: "Flight" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: "2026-01-20T00:00:00.000Z" })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ example: 1250.5, description: "Settlement amount" })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: "+1234567890" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "USD", default: "USD" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    example: "Hawaii",
    description:
      "Customer state — only used by the whitelisting gate inside BookingsService.create",
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
