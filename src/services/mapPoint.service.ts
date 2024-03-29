import { Document } from 'mongoose';
import { performance } from 'perf_hooks';

import { MapPoint } from '../models';
import { IMapPoint } from '../models/mapPoint.model';
import { toFixedWithoutRounding } from '../utils/formatFuncs';
import Logger from '../config/logger';

const logger = Logger('mapPoint.service');

const saveMapPoint = async (vehicleData: Document): Promise<IMapPoint | null> => {
  const startTime = performance.now();
  const { _id, vehicle, user, drive_state } = vehicleData.toJSON();
  const { longitude, latitude } = drive_state;

  // create coordinates for polygon
  const digitsAfterDecimal = 2;
  const long = toFixedWithoutRounding(longitude, digitsAfterDecimal);
  const lat = toFixedWithoutRounding(latitude, digitsAfterDecimal);
  const highLong = parseFloat(`${long}999999999999`);
  const highLat = parseFloat(`${lat}999999999999`);
  logger.debug('saving map point', { longitude, latitude, long, lat, highLong, highLat, digitsAfterDecimal });

  const mapPoint = await MapPoint.findOneAndUpdate(
    {
      geoJSON: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
      },
      vehicle,
      user,
    },
    {
      $setOnInsert: {
        geoJSON: {
          type: 'Polygon',
          coordinates: [
            [
              [long, lat],
              [long, highLat],
              [highLong, highLat],
              [highLong, lat],
              [long, lat],
            ],
          ],
        },
        vehicle,
        user,
      },
      $inc: { visitCount: 1 },
      $set: { dataPoints: [_id] },
    },
    { upsert: true, new: true }
  );
  const endTime = performance.now();

  logger.info(`${mapPoint.visitCount === 1 ? 'inserted' : 'updated'} map point`, {
    _id: mapPoint._id,
    vehicle: mapPoint.vehicle,
  });
  logger.debug(`call to saveMapPoint took ${endTime - startTime} milliseconds`);

  return mapPoint;
};

export default {
  saveMapPoint,
};
