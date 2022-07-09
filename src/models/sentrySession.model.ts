import mongoose, { Schema } from 'mongoose';
import { GeoJSONPoint } from './types.d';
import { objectIdToString } from './plugins';

export interface ISentrySession {
  _id: string;
  dataPoints: string[];
  startDate: Date;
  endDate: Date;
  geoJSON: GeoJSONPoint;
  vehicle: string;
  user: string;
}

const sentrySession = new Schema(
  {
    dataPoints: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'VehicleData',
        },
      ],
      default: [],
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
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
      required: [true, 'vehicle is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
sentrySession.plugin(objectIdToString());

sentrySession.index({ vehicle: 1, _id: -1 });

/**
 * @typedef SentrySession
 */
const SentrySession = mongoose.model<ISentrySession>('SentrySession', sentrySession);

export default SentrySession;
