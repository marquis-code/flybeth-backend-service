"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingEventSchema = exports.TrackingEvent = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let TrackingEvent = class TrackingEvent {
};
exports.TrackingEvent = TrackingEvent;
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['flight_status', 'user_journey'] }),
    __metadata("design:type", String)
], TrackingEvent.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ index: true }),
    __metadata("design:type", String)
], TrackingEvent.prototype, "entityId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TrackingEvent.prototype, "event", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], TrackingEvent.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TrackingEvent.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TrackingEvent.prototype, "ipAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TrackingEvent.prototype, "userAgent", void 0);
exports.TrackingEvent = TrackingEvent = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], TrackingEvent);
exports.TrackingEventSchema = mongoose_1.SchemaFactory.createForClass(TrackingEvent);
exports.TrackingEventSchema.index({ type: 1, entityId: 1, createdAt: -1 });
//# sourceMappingURL=tracking-event.schema.js.map