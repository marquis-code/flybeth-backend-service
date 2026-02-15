// src/modules/tracking/tracking.controller.ts
import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';

@Controller('tracking')
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) { }

    @Public()
    @Post('event')
    async trackEvent(@Body() body: any, @Req() req: Request) {
        const userId = (req as any).user?.sub || null;
        return this.trackingService.logUserJourney(
            userId,
            body.event,
            body.metadata,
            req.ip,
            req.headers['user-agent'],
        );
    }

    @Public() // Webhook from external airline provider
    @Post('webhook/flight-status')
    async flightStatusWebhook(@Body() body: any) {
        // Verify signature logic would go here
        return this.trackingService.logFlightStatus(
            body.pnr,
            body.status,
            body.details,
        );
    }

    @Get('history')
    async getMyHistory(@Req() req: any) {
        return this.trackingService.getUserHistory(req.user.sub);
    }

    @Public()
    @Get('flight/:pnr')
    async getFlightHistory(@Param('pnr') pnr: string) {
        return this.trackingService.getFlightHistory(pnr);
    }
}
