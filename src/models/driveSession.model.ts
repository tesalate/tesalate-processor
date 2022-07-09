import mongoose, { Schema } from 'mongoose';
import { objectIdToString } from './plugins';
import { GeoJSONPoint } from './types';

export interface IDriveSession {
  _id: string;
  dataPoints: string[];
  startDate: Date;
  endDate: Date;
  startLocation: GeoJSONPoint;
  endLocation: GeoJSONPoint;
  flags: string[];
  vehicle: string;
  user: string;
}

const driveSession = new Schema(
  {
    dataPoints: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'VehicleData',
          // autopopulate: { select: '_id, drive_state.power, vehicle_state.odometer' },
        },
      ],
      default: [],
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    startLocation: {
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
    endLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
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
  },
  {
    timestamps: true,
  }
);

driveSession.plugin(objectIdToString());

driveSession.index({ vehicle: 1, _id: -1 });
/**
 * @typedef DriveSession
 */
const DriveSession = mongoose.model<IDriveSession>('DriveSession', driveSession);

export default DriveSession;
