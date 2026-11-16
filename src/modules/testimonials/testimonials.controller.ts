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
import { TestimonialsService } from './testimonials.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('Testimonials')
@Controller('testimonials')
@UseGuards(RolesGuard)
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Approved, featured customer reviews plus the overall rating' })
  async featured(@Query('limit') limit?: string) {
    const result = await this.testimonialsService.featured(limit ? Number(limit) : 4);
    return { success: true, ...result };
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Create a testimonial (admin)' })
  async create(@Body() payload: any) {
    const testimonial = await this.testimonialsService.create(payload);
    return { success: true, data: testimonial };
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'List testimonials, including unapproved (admin)' })
  async list() {
    const testimonials = await this.testimonialsService.list();
    return { success: true, data: testimonials };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update or approve a testimonial (admin)' })
  async update(@Param('id') id: string, @Body() payload: any) {
    const testimonial = await this.testimonialsService.update(id, payload);
    return { success: true, data: testimonial };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete a testimonial (admin)' })
  async remove(@Param('id') id: string) {
    return this.testimonialsService.remove(id);
  }
}
