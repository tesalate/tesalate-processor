import mongoose, { Schema } from 'mongoose';
import { GeoJSONPoint } from './types';
import { objectIdToString } from './plugins';

export interface ICharger {
  _id: string;
  location_id: string;
  geoJSON: GeoJSONPoint;
}

const charger = new Schema<ICharger>(
  {
    location_id: { type: String },
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
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
charger.plugin(objectIdToString());

charger.index({ GeoJSON: '2dsphere' });
charger.index({ location_id: 1 });

/**
 * @typedef Charger
 */
const Charger = mongoose.model<ICharger>('Charger', charger);

export default Charger;
