"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAgentModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const jwt_config_1 = require("../../config/jwt.config");
const voice_agent_service_1 = require("./voice-agent.service");
const voice_agent_controller_1 = require("./voice-agent.controller");
const voice_agent_gateway_1 = require("./voice-agent.gateway");
const assemblyai_service_1 = require("./services/assemblyai.service");
const ai_engine_service_1 = require("./services/ai-engine.service");
const booking_flow_service_1 = require("./services/booking-flow.service");
const ai_support_service_1 = require("./services/ai-support.service");
const booking_reminder_service_1 = require("./services/booking-reminder.service");
const disruption_alert_service_1 = require("./services/disruption-alert.service");
const voice_session_schema_1 = require("./schemas/voice-session.schema");
const booking_draft_schema_1 = require("./schemas/booking-draft.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const flights_module_1 = require("../flights/flights.module");
const stays_module_1 = require("../stays/stays.module");
const cars_module_1 = require("../cars/cars.module");
const integrations_module_1 = require("../integrations/integrations.module");
const notifications_module_1 = require("../notifications/notifications.module");
const bookings_module_1 = require("../bookings/bookings.module");
let VoiceAgentModule = class VoiceAgentModule {
};
exports.VoiceAgentModule = VoiceAgentModule;
exports.VoiceAgentModule = VoiceAgentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: voice_session_schema_1.VoiceSession.name, schema: voice_session_schema_1.VoiceSessionSchema },
                { name: booking_draft_schema_1.BookingDraft.name, schema: booking_draft_schema_1.BookingDraftSchema },
                { name: booking_schema_1.Booking.name, schema: booking_schema_1.BookingSchema },
            ]),
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync(jwt_config_1.jwtConfig),
            flights_module_1.FlightsModule,
            stays_module_1.StaysModule,
            cars_module_1.CarsModule,
            integrations_module_1.IntegrationsModule,
            notifications_module_1.NotificationsModule,
            bookings_module_1.BookingsModule,
        ],
        controllers: [voice_agent_controller_1.VoiceAgentController],
        providers: [
            voice_agent_service_1.VoiceAgentService,
            assemblyai_service_1.AssemblyAIService,
            ai_engine_service_1.AIEngineService,
            booking_flow_service_1.BookingFlowService,
            ai_support_service_1.AISupportService,
            booking_reminder_service_1.BookingReminderService,
            disruption_alert_service_1.DisruptionAlertService,
            voice_agent_gateway_1.VoiceAgentGateway,
        ],
        exports: [voice_agent_service_1.VoiceAgentService],
    })
], VoiceAgentModule);
//# sourceMappingURL=voice-agent.module.js.map