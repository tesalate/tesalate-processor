import mongoose from 'mongoose';
import { cacheService } from '../services';
import { ChargeSession } from '../models';
import { IChargeSession } from '../models/chargeSession.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { IVehicleData } from '../models/vehicleData.model';
import { GeoJSONType } from '../models/types';

const ttl = 60 * 60 * 2;
const key = 'charge-session';

const createChargeSession = async (vehicleData: IVehicleData) => {
  const { drive_state, vehicle, user } = vehicleData;
  return new ChargeSession({
    geoJSON: {
      type: 'Point' as GeoJSONType,
      coordinates: [drive_state.longitude, drive_state.latitude],
    },
    vehicle,
    user,
  });
};

const getChargeSessionById = async (_id: string, vehicle: string): Promise<IChargeSession | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as IChargeSession;
  }
  const session = await ChargeSession.findOne({ _id, vehicle });
  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  return session;
};

const updateChargeSessionById = async (
  _id: string,
  vehicle: string,
  data: mongoose.UpdateQuery<IChargeSession>
): Promise<IChargeSession | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);
  const session = await ChargeSession.findOneAndUpdate({ _id: _id }, { ...data }, { upsert: true, new: true });

  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  return session;
};

export default {
  createChargeSession,
  getChargeSessionById,
  updateChargeSessionById,
};
