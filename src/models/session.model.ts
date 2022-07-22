import mongoose, { Schema } from 'mongoose';

import { GeoJSONPoint } from './types';
import { objectIdToString } from './plugins';

export enum SessionType {
  drive = 'drive',
  sleep = 'sleep',
  charge = 'charge',
  sentry = 'sentry',
  conditioning = 'conditioning',
}

export interface ISession {
  _id: string;
  dataPoints: string[];
  createdAt: Date;
  updatedAt: Date;
  startLocation: GeoJSONPoint;
  endLocation: GeoJSONPoint;
  flags: string[];
  vehicle: string;
  user: string;
  type: SessionType;
}

const sessionSchema = new Schema({
  dataPoints: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'VehicleData',
      },
    ],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  startLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: null,
    },
    coordinates: {
      type: [Number],
      default: null,
    },
  },
  endLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: null,
    },
    coordinates: {
      type: [Number],
      default: null,
    },
  },
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: {
      type: String,
      enum: Object.values(SessionType),
      required: true,
    },
  },
});

sessionSchema.plugin(objectIdToString());

sessionSchema.index({ vehicle: 1, _id: -1 });
sessionSchema.index({ vehicle: 1, type: 1 });
/**
 * @typedef Session
 */
const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;
