import mongoose, { Schema } from 'mongoose';
import { objectIdToString } from './plugins';

export interface IVehicle {
  _id: string;
  user: string;
  teslaAccount: string;
  collectData: boolean;
  id: number;
  vin: string;
  vehicle_id: number;
  display_name: string;
  option_codes: string;
  access_type: string;
  color: unknown;
  tokens: string[];
  state: string;
  in_service: boolean;
  id_s: string;
  calendar_enabled: boolean;
  api_version: number;
  backseat_token: unknown;
  backseat_token_updated_at: unknown;
}

const vehicleSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    teslaAccount: {
      type: Schema.Types.ObjectId,
      ref: 'TeslaAccount',
    },
    collectData: {
      type: Boolean,
      default: false,
    },
    id: {
      type: Number,
    },
    vin: {
      type: String,
      required: true,
      trim: true,
    },
    vehicle_id: {
      type: Number,
    },
    display_name: {
      type: String,
      default: '',
      trim: true,
    },
    option_codes: {
      type: String,
      trim: true,
    },
    access_type: {
      type: String,
    },
    color: {
      type: Schema.Types.Mixed,
    },
    // tokens: {
    //   type: Array,
    // },
    state: {
      type: String,
      trim: true,
    },
    in_service: {
      type: Boolean,
    },
    id_s: {
      type: String,
      required: true,
      trim: true,
    },
    calendar_enabled: {
      type: Boolean,
    },
    api_version: {
      type: Number,
    },
    backseat_token: {
      type: Schema.Types.Mixed,
    },
    backseat_token_updated_at: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ vin: 'text', user: 1 });
vehicleSchema.plugin(objectIdToString());

/**
 * @typedef Vehicle
 */
const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);

export default Vehicle;
