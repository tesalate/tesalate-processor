import mongoose, { Schema } from 'mongoose';
import { GeoJSONPolygon } from './types';
import { objectIdToString } from './plugins';

export interface IMapPoint {
  _id: string;
  dataPoints: string[];
  visitCount: number;
  latLongString: string;
  geoJSON: GeoJSONPolygon;
  vehicle: string;
  user: string;
  updatedAt: Date;
  createdAt: Date;
}

const mapPoint = new Schema(
  {
    dataPoints: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'VehicleData',
          autopopulate: { select: '_id drive_state.longitude drive_state.latitude drive_state.heading' },
        },
      ],
      default: [],
    },
    visitCount: {
      type: Number,
    },
    geoJSON: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    vehicle: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
  },
  {
    timestamps: true,
  }
);
// add plugin that converts mongoose to json
mapPoint.plugin(objectIdToString());

mapPoint.index({ vehicle: 1, _id: -1 });
mapPoint.index({ geoJSON: '2dsphere', vehicle: 1 });

// mapPoint.index({ user: 1 });

/**
 * @typedef MapPoint
 */
const MapPoint = mongoose.model<IMapPoint>('MapPoint', mapPoint);

export default MapPoint;
