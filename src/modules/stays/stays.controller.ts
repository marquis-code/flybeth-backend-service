// src/modules/stays/stays.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StaysService } from './stays.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { Public } from '../../common/decorators/public.decorator';
import { StaySearchDto } from './dto/stays.dto';

@Controller('stays')
export class StaysController {
    constructor(private readonly staysService: StaysService) { }

    @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN)
    @Post()
    createStay(@Body() createDto: any) {
        return this.staysService.createStay(createDto);
    }

    @Public()
    @Get()
    searchStays(@Query() query: StaySearchDto) {
        return this.staysService.search(query);
    }

    @Public()
    @Get(':id')
    getStay(@Param('id') id: string) {
        return this.staysService.getStayById(id);
    }

    @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN)
    @Post(':id/rooms')
    addRoom(@Param('id') id: string, @Body() createRoomDto: any) {
        return this.staysService.addRoom(id, createRoomDto);
    }

    @Public()
    @Get(':id/rooms')
    getRooms(@Param('id') id: string) {
        return this.staysService.getRooms(id);
    }
}
