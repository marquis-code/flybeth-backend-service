import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('Coupons')
@Controller('coupons')
@UseGuards(RolesGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Public coupons that may be shown on the landing page' })
  async active(@Query('limit') limit?: string) {
    const coupons = await this.couponsService.findPublicCoupons(limit ? Number(limit) : 3);
    return { success: true, data: coupons };
  }

  @Public()
  @Get('validate')
  @ApiOperation({ summary: 'Validate a promo code against an amount and product' })
  async validate(
    @Query('code') code: string,
    @Query('amount') amount?: string,
    @Query('product') product?: string,
  ) {
    return this.couponsService.validate(code, amount ? Number(amount) : 0, product || 'flights');
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Create a promo code (admin)' })
  async create(@Body() payload: any) {
    const coupon = await this.couponsService.create(payload);
    return { success: true, data: coupon };
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'List promo codes (admin)' })
  async list() {
    const coupons = await this.couponsService.list();
    return { success: true, data: coupons };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update a promo code (admin)' })
  async update(@Param('id') id: string, @Body() payload: any) {
    const coupon = await this.couponsService.update(id, payload);
    return { success: true, data: coupon };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete a promo code (admin)' })
  async remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
