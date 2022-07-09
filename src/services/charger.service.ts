import { Charger } from '../models';
import Logger from '../config/logger';
import { cacheService } from '../services';
import { ICharger } from '../models/charger.model';
import { DriveState } from '../models/vehicleData.model';

const logger = Logger('charger.service');

const ttl = 1 * 60 * 60 * 24; /** <--  1 day in seconds **/

const getChargerById = async (_id: string): Promise<ICharger | null> => {
  const cachedValue = await cacheService.getCache(_id);
  if (cachedValue) {
    await cacheService.setCacheExpire(_id, ttl);
    return cachedValue as unknown as ICharger;
  }
  logger.debug('getting charger from DB');
  const charger = await Charger.findOne({ _id });
  if (charger) {
    await cacheService.setCache(charger._id, charger, ttl);
  }
  logger.debug('found charger from DB');
  return charger;
};

const getNearestChargerByDistance = async (drive_state: DriveState, distance: number): Promise<ICharger | null> => {
  const { longitude, latitude } = drive_state;

  if (!longitude || !latitude) throw new Error('missing lat or long');
  if (typeof distance !== 'number') throw new Error('distance must be a number');

  const cacheKey = `charger:${longitude.toFixed(3)}-${latitude.toFixed(3)}-${distance}`;
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as ICharger;
  }

  logger.debug('getting nearest charger from DB');
  const [nearestCharger] = await Charger.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [longitude, latitude] },
        distanceField: 'dist.calculated',
        maxDistance: distance,
        spherical: true,
      },
    },
    { $limit: 1 },
  ]);

  if (nearestCharger) {
    await cacheService.setCache(cacheKey, nearestCharger, ttl);
  }
  logger.debug('found nearest charger from DB');
  return nearestCharger;
};

export default {
  getChargerById,
  getNearestChargerByDistance,
};
