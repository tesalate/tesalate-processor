import mongoose from 'mongoose';
import Logger from '../config/logger';
import { SleepSession } from '../models';
import { cacheService } from '../services';
import { IVehicle } from '../models/vehicle.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { ISleepSession } from '../models/sleepSession.model';

const logger = Logger('sleep-session.service');
export const ttl = 60 * 60;
export const key = 'sleep-session';

const createSleepSession = async (vehicle: IVehicle): Promise<ISleepSession> => {
  logger.debug('creating sleep session');
  const { _id: vehicleId, user } = vehicle;
  const session = (
    await SleepSession.create({
      vehicle: vehicleId,
      user,
    })
  ).toJSON();
  logger.debug('created sleep session', { session: session._id });
  const cacheKey = buildCacheKey(vehicleId, '', key);
  await cacheService.setCache(cacheKey, session, ttl);
  return session;
};

const getSleepSessionById = async (_id: string, vehicle: string): Promise<ISleepSession | null> => {
  const cacheKey = buildCacheKey(vehicle, '', key);
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as ISleepSession;
  }
  logger.debug('getting sleep session from DB');
  const session = await SleepSession.findOne({ _id, vehicle }).lean();
  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  logger.debug('found sleep session from DB');
  return session;
};

const updateSleepSessionById = async (
  _id: string,
  vehicle: string,
  data: mongoose.UpdateQuery<ISleepSession>
): Promise<ISleepSession | null> => {
  logger.debug('updating sleep session in DB');
  const cacheKey = buildCacheKey(vehicle, '', key);

  const session = await SleepSession.findOneAndUpdate({ _id: _id }, { ...data }, { new: true, upsert: true }).lean();

  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  logger.debug('updated sleep session in DB');

  return session;
};

export default {
  createSleepSession,
  getSleepSessionById,
  updateSleepSessionById,
};
