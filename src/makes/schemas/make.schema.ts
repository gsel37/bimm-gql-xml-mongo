import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, InferSchemaType } from 'mongoose';

export type MakeDocument = HydratedDocument<Make>;

@Schema()
export class Make {
  @Prop({ required: true })
  makeId: string;

  @Prop({ required: true })
  makeName: string;

  @Prop(raw([{ typeId: String, typeName: String }, { default: [] }]))
  vehicleTypes: Record<string, any>[];
}

export const MakeSchema = SchemaFactory.createForClass(Make);

export type MakeType = InferSchemaType<typeof MakeSchema>;
