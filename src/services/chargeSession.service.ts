import mongoose, { Document } from 'mongoose';
import { cacheService } from '../services';
import { ChargeSession } from '../models';
import { IChargeSession } from '../models/chargeSession.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { IVehicleData } from '../models/vehicleData.model';
import { GeoJSONType } from '../models/types';

const ttl = 60 * 60 * 2;
const key = 'charge-session';

const createChargeSession = async (vehicleData: Document<IVehicleData>) => {
  const { drive_state, vehicle, user } = vehicleData.toJSON();
  const cacheKey = buildCacheKey(vehicle, '', key);
  const session = (
    await ChargeSession.create({
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

const updateChargeSessionById = async (_id: string | null | undefined, vehicleData: Document): Promise<IChargeSession> => {
  const { vehicle, user, drive_state } = vehicleData.toJSON();
  const session = await ChargeSession.findOneAndUpdate(
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
  createChargeSession,
  getChargeSessionById,
  updateChargeSessionById,
};
