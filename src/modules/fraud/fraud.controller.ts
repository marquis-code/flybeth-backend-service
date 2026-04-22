import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FraudService } from "./fraud.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles.constant";

@ApiTags("Admin Fraud")
@ApiBearerAuth()
@Controller("admin/fraud")
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.STAFF)
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get fraud and security statistics" })
  getStats() {
    return this.fraudService.getStats();
  }

  @Get("high-risk-bookings")
  @ApiOperation({ summary: "List bookings with high risk scores" })
  getHighRiskBookings() {
    return this.fraudService.getHighRiskBookings();
  }

  @Get("bot-events")
  @ApiOperation({ summary: "Analyze and list potential bot activity" })
  getBotEvents() {
    return this.fraudService.getBotEvents();
  }

  @Post("bookings/:id/approve")
  @ApiOperation({ summary: "Manually approve a high-risk booking" })
  approveBooking(@Param("id") id: string) {
    return this.fraudService.updateBookingFraudStatus(id, 'approved');
  }

  @Post("bookings/:id/reject")
  @ApiOperation({ summary: "Manually reject and flag a booking as fraud" })
  rejectBooking(@Param("id") id: string) {
    return this.fraudService.updateBookingFraudStatus(id, 'rejected');
  }
}
