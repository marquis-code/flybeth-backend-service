// src/modules/voice-agent/voice-agent.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';

import { VoiceAgentService } from './voice-agent.service';
import { VoiceAgentController } from './voice-agent.controller';
import { VoiceAgentGateway } from './voice-agent.gateway';

import { AssemblyAIService } from './services/assemblyai.service';
import { AIEngineService } from './services/ai-engine.service';
import { BookingFlowService } from './services/booking-flow.service';
import { AISupportService } from './services/ai-support.service';
import { BookingReminderService } from './services/booking-reminder.service';
import { DisruptionAlertService } from './services/disruption-alert.service';

import { VoiceSession, VoiceSessionSchema } from './schemas/voice-session.schema';
import { BookingDraft, BookingDraftSchema } from './schemas/booking-draft.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';

import { FlightsModule } from '../flights/flights.module';
import { StaysModule } from '../stays/stays.module';
import { CarsModule } from '../cars/cars.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { NotificationsModule } from '../notifications/notifications.module';
// import { PackagesModule } from '../packages/packages.module'; // Enable if ready
import { BookingsModule } from '../bookings/bookings.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: VoiceSession.name, schema: VoiceSessionSchema },
            { name: BookingDraft.name, schema: BookingDraftSchema },
            { name: Booking.name, schema: BookingSchema },
        ]),
        ConfigModule,
        JwtModule.registerAsync(jwtConfig),
        FlightsModule,
        StaysModule,
        CarsModule,
        IntegrationsModule,
        NotificationsModule,
        BookingsModule,
    ],
    controllers: [VoiceAgentController],
    providers: [
        VoiceAgentService,
        AssemblyAIService,
        AIEngineService,
        BookingFlowService,
        AISupportService,
        BookingReminderService,
        DisruptionAlertService,
        VoiceAgentGateway,
    ],
    exports: [VoiceAgentService],
})
export class VoiceAgentModule { }
