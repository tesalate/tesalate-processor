import mongoose, { Document } from 'mongoose';
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
  const cacheKey = buildCacheKey(vehicle, '', key);
  const session = (
    await SentrySession.create({
      geoJSON: {
        type: 'Point' as GeoJSONType,
        coordinates: [drive_state.longitude, drive_state.latitude],
      },
      dataPoints: [vehicleData],
      vehicle,
      user,
    })
  ).toJSON();
  await cacheService.setCache(cacheKey, session, ttl);
  return session;
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

const updateSentrySessionById = async (_id: string | undefined | null, vehicleData: Document): Promise<ISentrySession> => {
  const { vehicle, user, drive_state } = vehicleData.toJSON();
  const session = await SentrySession.findOneAndUpdate(
    { _id: _id ?? new mongoose.Types.ObjectId() },
    {
      $set: {
        endDate: new Date(drive_state.timestamp),
      },
      $push: { dataPoints: vehicleData._id },
      $setOnInsert: {
        vehicle,
        user,
        geoJSON: {
          type: 'Point',
          coordinates: [drive_state.longitude, drive_state.latitude],
        },
      },
    },
    { upsert: true, new: true }
  );

  const cacheKey = buildCacheKey(session.vehicle, session._id, key);
  await cacheService.setCache(cacheKey, session, ttl);
  return session;
};

export default {
  createSentrySession,
  getSentrySessionById,
  updateSentrySessionById,
};
