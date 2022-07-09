import mongoose, { Schema } from 'mongoose';
import { objectIdToString } from './plugins';

export interface IUser {
  _id: string;
  username: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  teslaAccount: string;
  vehicles: string[];
}

const userSchema = new Schema(
  {
    username: {
      type: String,
    },
    displayName: {
      type: String,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
    },
    teslaAccount: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'TeslaAccount',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(objectIdToString());

/**
 * @typedef User
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User;
