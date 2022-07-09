import mongoose from 'mongoose';
import { cacheService } from '../services';
import { DriveSession } from '../models';
import { IDriveSession } from '../models/driveSession.model';
import { IVehicleData } from '../models/vehicleData.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { GeoJSONType } from '../models/types';

const ttl = 60 * 60;
const key = 'drive-session';

const createDriveSession = async (vehicleData: IVehicleData) => {
  const { drive_state, vehicle, user } = vehicleData;
  return new DriveSession({
    startLocation: {
      type: 'Point' as GeoJSONType,
      coordinates: [drive_state.longitude, drive_state.latitude],
    },
    endLocation: {
      type: 'Point' as GeoJSONType,
      coordinates: [drive_state.longitude, drive_state.latitude],
    },
    vehicle,
    user,
  });
};

const getDriveSessionById = async (_id: string, vehicle: string): Promise<IDriveSession | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as IDriveSession;
  }
  const session = await DriveSession.findOne({ _id, vehicle });
  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  return session;
};

const updateDriveSessionById = async (
  _id: string,
  vehicle: string,
  data: mongoose.UpdateQuery<IDriveSession>
): Promise<IDriveSession | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);

  const session = await DriveSession.findOneAndUpdate({ _id: _id }, { ...data }, { upsert: true, new: true });

  if (session) {
    await cacheService.setCache(cacheKey, session, ttl);
  }
  return session;
};

export default {
  createDriveSession,
  getDriveSessionById,
  updateDriveSessionById,
};
