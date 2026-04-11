// src/modules/integrations/schemas/flight-provider-config.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type FlightProviderConfigDocument = FlightProviderConfig & Document;

@Schema({ _id: false })
export class ProviderEntry {
  @Prop({ required: true })
  name: string; // 'amadeus' | 'duffel'

  @Prop({ required: true })
  displayName: string; // 'Amadeus' | 'Duffel'

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: 0 })
  priority: number; // Lower = higher priority

  @Prop({ type: [String], default: ["flights"] })
  supportedServices: string[]; // ['flights'] or ['flights', 'stays']
}

@Schema({ timestamps: true, collection: "flight_provider_configs" })
export class FlightProviderConfig {
  @Prop({
    type: [ProviderEntry],
    default: [
      {
        name: "amadeus",
        displayName: "Amadeus",
        enabled: true,
        priority: 1,
        supportedServices: ["flights"],
      },
      {
        name: "hotelbeds",
        displayName: "Hotelbeds",
        enabled: true,
        priority: 0,
        supportedServices: ["stays", "transfers", "cars", "experiences"],
      },
    ],
  })
  providers: ProviderEntry[];

  @Prop({ default: 5, min: 0, max: 100 })
  commissionPercentage: number;

  @Prop({ enum: ["percentage", "fixed"], default: "percentage" })
  commissionType: string;

  @Prop({ default: 0, min: 0 })
  fixedCommissionAmount: number;

  @Prop({ default: "USD" })
  commissionCurrency: string;
}

export const FlightProviderConfigSchema =
  SchemaFactory.createForClass(FlightProviderConfig);
