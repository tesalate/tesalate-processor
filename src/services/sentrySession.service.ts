import mongoose from 'mongoose';
import { cacheService } from '../services';
import { SentrySession } from '../models';
import { ISentrySession } from '../models/sentrySession.model';
import { IVehicleData } from '../models/vehicleData.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { GeoJSONType } from '../models/types';

const ttl = 30;
const key = 'sentry-session';

const createSentrySession = async (vehicleData: IVehicleData) => {
  const { drive_state, vehicle, user } = vehicleData;
  return new SentrySession({
    geoJSON: {
      type: 'Point' as GeoJSONType,
      coordinates: [drive_state.longitude, drive_state.latitude],
    },
    vehicle,
    user,
  });
};

const getSentrySessionById = async (_id: string, vehicle: string): Promise<ISentrySession | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as ISentrySession;
  }
  const session = await SentrySession.findOne({ _id, vehicle });
  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  return session;
};

const updateSentrySessionById = async (
  _id: string,
  vehicle: string,
  data: mongoose.UpdateQuery<ISentrySession>
): Promise<ISentrySession | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);

  const session = await SentrySession.findOneAndUpdate({ _id: _id }, { ...data }, { upsert: true, new: true });

  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  return session;
};

export default {
  createSentrySession,
  getSentrySessionById,
  updateSentrySessionById,
};
