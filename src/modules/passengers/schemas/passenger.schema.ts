// src/modules/passengers/schemas/passenger.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type PassengerDocument = Passenger & Document;

@Schema({ timestamps: true, collection: "passengers" })
export class Passenger {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop()
  dateOfBirth: Date;

  @Prop({ enum: ["male", "female", "other"] })
  gender: string;

  @Prop()
  title: string;

  @Prop()
  duffelPassengerId: string;

  @Prop()
  nationality: string;

  @Prop()
  passportNumber: string;

  @Prop()
  passportExpiry: Date;

  @Prop()
  passportCountry: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ enum: ["adult", "child", "infant"], default: "adult" })
  type: string;

  @Prop({ type: { airline: String, number: String } })
  frequentFlyer: { airline: string; number: string };

  @Prop()
  profilePicture: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  documents: Array<{ name: string; url: string; type: string; uploadedAt: Date }>;
}

export const PassengerSchema = SchemaFactory.createForClass(Passenger);

PassengerSchema.index({ user: 1 });
PassengerSchema.index({ passportNumber: 1 }, { sparse: true });
PassengerSchema.index({ firstName: "text", lastName: "text" });
