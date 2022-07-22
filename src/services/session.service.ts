import isEmpty from 'lodash/isEmpty';
import { performance } from 'perf_hooks';
import mongoose, { Document } from 'mongoose';

import { cacheService } from '.';
import { Session } from '../models';
import { ISession } from '../models/session.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { SessionType } from '../models/session.model';
import Logger from '../config/logger';

const logger = Logger('session.service');

/* default cache length for sessions to 10 minutes */
const ttl = 60 * 10;

const upsertSessionById = async (
  _id: string | null | undefined,
  user: string,
  vehicle: string,
  type: SessionType,
  vehicleData?: Document
): Promise<ISession> => {
  const query = { _id: _id ?? new mongoose.Types.ObjectId(), vehicle, user, type };
  let session;
  const startTime = performance.now();
  switch (type) {
    // when the vehicle is asleep, we do not have a vehicleData object
    case SessionType['sleep']: {
      session = await Session.findOneAndUpdate(
        query,
        {
          $set: {
            updatedAt: new Date(),
          },
          $setOnInsert: {
            vehicle,
            type,
            user,
          },
        },
        { upsert: true, new: true }
      );
      break;
    }

    /*
     * drive, charge, sentry, and conditioning sessions
     * are handled the same way as they will should all
     * have a vehicleData object
     */
    case SessionType['drive']:
    case SessionType['charge']:
    case SessionType['sentry']:
    case SessionType['conditioning']: {
      if (!vehicleData || isEmpty(vehicleData)) throw new Error('No vehicle data');

      const { drive_state } = vehicleData.toJSON();
      session = await Session.findOneAndUpdate(
        query,
        {
          $set: {
            updatedAt: new Date(drive_state.timestamp),
            // endLocation will only change on drive sessions
            endLocation: { type: 'Point', coordinates: [drive_state.longitude, drive_state.latitude] },
          },
          $addToSet: { dataPoints: vehicleData._id },
          $setOnInsert: {
            user,
            type,
            vehicle,
            createdAt: new Date(drive_state.timestamp),
            startLocation: { type: 'Point', coordinates: [drive_state.longitude, drive_state.latitude] },
          },
        },
        { upsert: true, new: true }
      );
      break;
    }

    default: {
      throw new Error(`Unhandled session type: '${type}'`);
    }
  }
  const endTime = performance.now();

  const cacheKey = buildCacheKey(session.vehicle, `${SessionType[type]}-session`);
  await cacheService.setCache(cacheKey, session, ttl);
  logger.debug(`Call to upsertSessionById took ${endTime - startTime} milliseconds`);
  return session;
};

export default {
  upsertSessionById,
};
