import mongoose, { Schema } from 'mongoose';
import { objectIdToString } from './plugins';

export interface ISleepSession {
  _id: string;
  startDate: Date;
  endDate: Date;
  vehicle: string;
  user: string;
}

const sleepSession = new Schema(
  {
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
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
sleepSession.plugin(objectIdToString());

sleepSession.index({ vehicle: 1, _id: -1 });

/**
 * @typedef SleepSession
 */
const SleepSession = mongoose.model<ISleepSession>('SleepSession', sleepSession);

export default SleepSession;
