// src/modules/passengers/passengers.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PassengersService } from './passengers.service';
import { CreatePassengerDto, UpdatePassengerDto } from './dto/passenger.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@ApiTags('Passengers')
@ApiBearerAuth()
@Controller('passengers')
export class PassengersController {
    constructor(private readonly passengersService: PassengersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a saved traveler profile' })
    create(
        @CurrentUser('_id') userId: string,
        @Body() dto: CreatePassengerDto,
    ) {
        return this.passengersService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all saved travelers for current user' })
    findAll(@CurrentUser('_id') userId: string) {
        return this.passengersService.findByUser(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get traveler by ID' })
    findOne(@Param('id', MongoIdValidationPipe) id: string) {
        return this.passengersService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update traveler profile' })
    update(
        @Param('id', MongoIdValidationPipe) id: string,
        @CurrentUser('_id') userId: string,
        @Body() dto: UpdatePassengerDto,
    ) {
        return this.passengersService.update(id, userId, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete traveler profile' })
    remove(
        @Param('id', MongoIdValidationPipe) id: string,
        @CurrentUser('_id') userId: string,
    ) {
        return this.passengersService.delete(id, userId);
    }
}
