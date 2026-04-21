import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { WalletService } from './wallet.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(RolesGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly walletService: WalletService
  ) {}

  @Get('wallet/balance')
  @Roles(Role.AGENT, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get current wallet balance' })
  getWalletBalance(@CurrentUser('_id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Get('wallet/transactions')
  @Roles(Role.AGENT, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get wallet transaction history' })
  getWalletTransactions(
    @CurrentUser('_id') userId: string,
    @Query('limit') limit?: number
  ) {
    return this.walletService.getTransactions(userId, limit);
  }

  @Get('invoices')
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get all invoices for tenant' })
  findAll(@CurrentUser('tenant') tenantId: string) {
    return this.financeService.findAll(tenantId);
  }

  @Get('stats')
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get financial overview for tenant' })
  getStats(@CurrentUser('tenant') tenantId: string) {
    return this.financeService.getStats(tenantId);
  }

  @Post('invoices')
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Create manual invoice' })
  create(
    @CurrentUser('tenant') tenantId: string,
    @CurrentUser('_id') userId: string,
    @Body() data: any
  ) {
    return this.financeService.createInvoice(tenantId, userId, data);
  }
}
