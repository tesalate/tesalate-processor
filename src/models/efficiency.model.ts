import mongoose, { Schema } from 'mongoose';

import { objectIdToString } from './plugins';

export interface IEfficiency {
  _id: string;
  vehicle: string;
  user: string;
  metadata: any;
}

const efficiencySchema = new Schema(
  {
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
    metadata: {
      default: {},
      type: Schema.Types.Mixed,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    default: { type: Schema.Types.Number, default: 0 },
  },
  { strict: false }
);

efficiencySchema.plugin(objectIdToString());

efficiencySchema.index({ _id: -1, vehicle: 1, user: 1 });
/**
 * @typedef Efficiency
 */
const Efficiency = mongoose.model<IEfficiency>('Efficiency', efficiencySchema, 'efficiency');

export default Efficiency;
