import mongoose from 'mongoose';
import { cacheService } from '.';
import { ConditioningSession } from '../models';
import { IConditioningSession } from '../models/conditioningSession.model';
import { IVehicleData } from '../models/vehicleData.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { GeoJSONType } from '../models/types';

const ttl = 30;
const key = 'conditioning-session';

const createConditioningSession = async (vehicleData: IVehicleData) => {
  const { drive_state, vehicle, user } = vehicleData;
  return new ConditioningSession({
    geoJSON: {
      type: 'Point' as GeoJSONType,
      coordinates: [drive_state.longitude, drive_state.latitude],
    },
    vehicle,
    user,
  });
};

const getConditioningSessionById = async (_id: string, vehicle: string): Promise<IConditioningSession | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as IConditioningSession;
  }
  const session = await ConditioningSession.findOne({ _id, vehicle });
  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  return session;
};

const updateConditioningSessionById = async (
  _id: string,
  vehicle: string,
  data: mongoose.UpdateQuery<IConditioningSession>
): Promise<IConditioningSession | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);

  const session = await ConditioningSession.findOneAndUpdate({ _id: _id }, { ...data }, { upsert: true, new: true });

  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  return session;
};

export default {
  createConditioningSession,
  getConditioningSessionById,
  updateConditioningSessionById,
};
