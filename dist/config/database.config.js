"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const databaseConfig = (configService) => ({
    uri: configService.get('MONGODB_URI'),
    autoIndex: true,
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
});
exports.databaseConfig = databaseConfig;
//# sourceMappingURL=database.config.js.map