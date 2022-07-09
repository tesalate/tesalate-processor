import mongoose, { Schema } from 'mongoose';
import { GeoJSONPoint } from './types';
import { objectIdToString } from './plugins';

export interface IChargeSession {
  _id: string;
  dataPoints: string[];
  startDate: Date;
  endDate: Date;
  maxChargeRate: number;
  energyAdded: number;
  charger: string;
  geoJSON: GeoJSONPoint;
  vehicle: string;
  user: string;
}

const chargeSession = new Schema(
  {
    dataPoints: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'VehicleData',
          autopopulate: false,
        },
      ],
      default: [],
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    charger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charger',
      default: null,
    },
    geoJSON: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
chargeSession.plugin(objectIdToString());

chargeSession.index({ vehicle: 1, _id: -1 });

/**
 * @typedef ChargeSession
 */
const ChargeSession = mongoose.model<IChargeSession>('ChargeSession', chargeSession);

export default ChargeSession;
