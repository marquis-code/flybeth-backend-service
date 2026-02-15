"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CruisesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const cruises_controller_1 = require("./cruises.controller");
const cruises_service_1 = require("./cruises.service");
const cruise_schema_1 = require("./schemas/cruise.schema");
let CruisesModule = class CruisesModule {
};
exports.CruisesModule = CruisesModule;
exports.CruisesModule = CruisesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: cruise_schema_1.Cruise.name, schema: cruise_schema_1.CruiseSchema }]),
        ],
        controllers: [cruises_controller_1.CruisesController],
        providers: [cruises_service_1.CruisesService],
        exports: [cruises_service_1.CruisesService],
    })
], CruisesModule);
//# sourceMappingURL=cruises.module.js.map