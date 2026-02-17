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
exports.VoiceSessionSchema = exports.VoiceSession = exports.ConversationMessage = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const roles_constant_1 = require("../../../common/constants/roles.constant");
let ConversationMessage = class ConversationMessage {
};
exports.ConversationMessage = ConversationMessage;
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.ConversationRole, required: true }),
    __metadata("design:type", String)
], ConversationMessage.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ConversationMessage.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], ConversationMessage.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ConversationMessage.prototype, "intent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], ConversationMessage.prototype, "entities", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ConversationMessage.prototype, "transcriptionId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ConversationMessage.prototype, "confidence", void 0);
exports.ConversationMessage = ConversationMessage = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ConversationMessage);
let VoiceSession = class VoiceSession {
};
exports.VoiceSession = VoiceSession;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoiceSession.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.VoiceSessionStatus, default: roles_constant_1.VoiceSessionStatus.ACTIVE }),
    __metadata("design:type", String)
], VoiceSession.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ConversationMessage], default: [] }),
    __metadata("design:type", Array)
], VoiceSession.prototype, "conversationHistory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'search' }),
    __metadata("design:type", String)
], VoiceSession.prototype, "currentStep", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'BookingDraft' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoiceSession.prototype, "bookingDraft", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], VoiceSession.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VoiceSession.prototype, "language", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], VoiceSession.prototype, "totalInteractions", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], VoiceSession.prototype, "lastInteractionAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], VoiceSession.prototype, "endedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VoiceSession.prototype, "streamingToken", void 0);
exports.VoiceSession = VoiceSession = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'voice_sessions' })
], VoiceSession);
exports.VoiceSessionSchema = mongoose_1.SchemaFactory.createForClass(VoiceSession);
exports.VoiceSessionSchema.index({ lastInteractionAt: 1 }, { expireAfterSeconds: 7200, partialFilterExpression: { status: 'abandoned' } });
exports.VoiceSessionSchema.index({ user: 1, status: 1 });
exports.VoiceSessionSchema.index({ createdAt: -1 });
//# sourceMappingURL=voice-session.schema.js.map