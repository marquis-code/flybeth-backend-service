// src/config/database.config.ts
import { ConfigService } from '@nestjs/config';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export const databaseConfig = (configService: ConfigService): MongooseModuleFactoryOptions => ({
    uri: configService.get<string>('MONGODB_URI'),
    autoIndex: true,
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
});
