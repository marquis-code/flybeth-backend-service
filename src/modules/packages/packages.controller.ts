// src/modules/packages/packages.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { Public } from '../../common/decorators/public.decorator';

@Controller('packages')
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) { }

    @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN)
    @Post()
    create(@Body() createPackageDto: any) {
        return this.packagesService.create(createPackageDto);
    }

    @Public()
    @Get()
    findAll(@Query() query: any) {
        return this.packagesService.findAll(query);
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.packagesService.findById(id);
    }
}
