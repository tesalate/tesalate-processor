import mongoose, { Schema } from 'mongoose';
import { GeoJSONPoint } from './types';
import { objectIdToString } from './plugins';

export interface IConditioningSession {
  _id: string;
  dataPoints: string[];
  startDate: Date;
  endDate: Date;
  geoJSON: GeoJSONPoint;
  vehicle: string;
  user: string;
}

const conditioningSession = new Schema(
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
conditioningSession.plugin(objectIdToString());

// conditioningSession.index({ vehicle: 'text', user: 1 });

/**
 * @typedef ConditioningSession
 */
const ConditioningSession = mongoose.model<IConditioningSession>('ConditioningSession', conditioningSession);

export default ConditioningSession;
