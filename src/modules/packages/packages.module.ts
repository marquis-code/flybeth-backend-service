// src/modules/packages/packages.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PackagesController } from "./packages.controller";
import { PackagesService } from "./packages.service";
import { Package, PackageSchema } from "./schemas/package.schema";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Package.name, schema: PackageSchema }]),
    IntegrationsModule,
  ],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
