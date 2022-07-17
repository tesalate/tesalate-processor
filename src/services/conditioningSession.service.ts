import mongoose, { Document } from 'mongoose';
import { cacheService } from '.';
import { ConditioningSession } from '../models';
import { IConditioningSession } from '../models/conditioningSession.model';
// import { IVehicleData } from '../models/vehicleData.model';
import { buildCacheKey } from '../utils/formatFuncs';
// import { GeoJSONType } from '../models/types';

const ttl = 30;
const key = 'conditioning-session';

// const createConditioningSession = async (vehicleData: Document<IVehicleData>) => {
//   const { drive_state, vehicle, user } = vehicleData.toJSON();
//   const cacheKey = buildCacheKey(vehicle, '', key);
//   const session = (
//     await ConditioningSession.create({
//       geoJSON: {
//         type: 'Point' as GeoJSONType,
//         coordinates: [drive_state.longitude, drive_state.latitude],
//       },
//       dataPoints: [vehicleData],
//       vehicle,
//       user,
//     })
//   ).toJSON();
//   await cacheService.setCache(cacheKey, session, ttl);
//   return session;
// };

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
  _id: string | null | undefined,
  vehicleData: Document
): Promise<IConditioningSession> => {
  const { vehicle, user, drive_state } = vehicleData.toJSON();
  const session = await ConditioningSession.findOneAndUpdate(
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
  // createConditioningSession,
  getConditioningSessionById,
  updateConditioningSessionById,
};
