import mongoose, { Document } from 'mongoose';
import { cacheService } from '../services';
import { DriveSession } from '../models';
import { IDriveSession } from '../models/driveSession.model';
import { IVehicleData } from '../models/vehicleData.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { GeoJSONType } from '../models/types';

const ttl = 60 * 60;
const key = 'drive-session';

const createDriveSession = async (vehicleData: Document<IVehicleData>) => {
  const { drive_state, vehicle, user } = vehicleData.toJSON();
  const cacheKey = buildCacheKey(vehicle, '', key);
  const session = (
    await DriveSession.create({
      startLocation: {
        type: 'Point' as GeoJSONType,
        coordinates: [drive_state.longitude, drive_state.latitude],
      },
      endLocation: {
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

const updateDriveSessionById = async (_id: string | null | undefined, vehicleData: Document): Promise<IDriveSession> => {
  const { vehicle, user, drive_state } = vehicleData.toJSON();
  const session = await DriveSession.findOneAndUpdate(
    { _id: _id ?? new mongoose.Types.ObjectId() },
    {
      $set: {
        endDate: new Date(drive_state.timestamp),
        endLocation: { type: 'Point', coordinates: [drive_state.longitude, drive_state.latitude] },
      },
      $push: { dataPoints: vehicleData._id },
      $setOnInsert: {
        vehicle,
        user,
        startLocation: {
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
  createDriveSession,
  getDriveSessionById,
  updateDriveSessionById,
};
