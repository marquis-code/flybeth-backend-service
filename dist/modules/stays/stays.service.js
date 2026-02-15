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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaysService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const stay_schema_1 = require("./schemas/stay.schema");
const room_schema_1 = require("./schemas/room.schema");
let StaysService = class StaysService {
    constructor(stayModel, roomModel) {
        this.stayModel = stayModel;
        this.roomModel = roomModel;
    }
    async createStay(createDto) {
        const stay = new this.stayModel(createDto);
        return stay.save();
    }
    async search(query) {
        const filter = { isActive: true };
        if (query.city)
            filter['location.city'] = new RegExp(query.city, 'i');
        if (query.country)
            filter['location.country'] = new RegExp(query.country, 'i');
        return this.stayModel.find(filter).exec();
    }
    async getStayById(id) {
        const stay = await this.stayModel.findById(id).exec();
        if (!stay)
            throw new common_1.NotFoundException('Stay not found');
        return stay;
    }
    async addRoom(stayId, createRoomDto) {
        const room = new this.roomModel({ ...createRoomDto, stay: stayId });
        return room.save();
    }
    async getRooms(stayId) {
        return this.roomModel.find({ stay: stayId }).exec();
    }
    async getRoomById(id) {
        const room = await this.roomModel.findById(id).exec();
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        return room;
    }
    async updateRoomAvailability(roomId, quantityChange) {
        const room = await this.getRoomById(roomId);
        if (room.quantity < quantityChange && quantityChange > 0) {
            throw new common_1.BadRequestException('Not enough rooms available');
        }
        room.quantity -= quantityChange;
        await room.save();
    }
};
exports.StaysService = StaysService;
exports.StaysService = StaysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(stay_schema_1.Stay.name)),
    __param(1, (0, mongoose_1.InjectModel)(room_schema_1.Room.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], StaysService);
//# sourceMappingURL=stays.service.js.map