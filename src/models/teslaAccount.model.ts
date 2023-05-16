import mongoose, { Schema } from 'mongoose';
import { objectIdToString } from './plugins';

export interface ITeslaAccount {
  _id: string | undefined;
  user: string;
  vehicles: string[];
  access_token: string;
  refresh_token: string;
  linked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const teslaAccountSchema = new Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    access_token: {
      type: String,
      trim: true,
    },
    refresh_token: {
      type: String,
      trim: true,
    },
    linked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
teslaAccountSchema.plugin(objectIdToString());

teslaAccountSchema.index({ user: 1, email: 1 }, { unique: true });

/**
 * @typedef TeslaAccount
 */
const TeslaAccount = mongoose.model<ITeslaAccount>('TeslaAccount', teslaAccountSchema);

export default TeslaAccount;
