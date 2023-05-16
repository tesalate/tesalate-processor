import isEmpty from 'lodash/isEmpty';
import { performance } from 'perf_hooks';
import mongoose, { Document, AggregateOptions } from 'mongoose';

import { cacheService } from '.';
import { Session } from '../models';
import { ISession } from '../models/session.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { SessionType } from '../models/session.model';
import Logger from '../config/logger';
import { IVehicleData } from '../models/vehicleData.model';

const logger = Logger('session.service');

/* default cache length for sessions to 10 minutes */
const ttl = 60 * 10;

const upsertSessionById = async (
  _id: string | null | undefined,
  user: string,
  vehicle: string,
  type: SessionType,
  vehicleData?: Document,
  interval?: number | undefined
): Promise<ISession> => {
  const query = { _id: _id ?? new mongoose.Types.ObjectId() };
  let session;
  const startTime = performance.now();
  const now = new Date();
  switch (type) {
    // when the vehicle is asleep, we do not have a vehicleData object
    case SessionType['sleep']: {
      session = await Session.findOneAndUpdate(
        query,
        {
          $set: {
            updatedAt: now,
          },
          $setOnInsert: {
            vehicle,
            type,
            user,
            metadata: {
              interval,
            },
            createdAt: now,
          },
        },
        { upsert: true, new: true, select: '_id createdAt updatedAt' }
      );
      const cacheKey = buildCacheKey(vehicle, `${SessionType[type]}-session`);
      await cacheService.setCache(cacheKey, session, ttl);
      break;
    }

    /*
     * drive, charge, sentry, and conditioning sessions
     * are handled the same way as they will should all
     * have a vehicleData object
     */
    case SessionType['idle']:
    case SessionType['drive']:
    case SessionType['charge']:
    case SessionType['sentry']:
    case SessionType['conditioning']: {
      if (!vehicleData || isEmpty(vehicleData)) throw new Error('No vehicle data');

      const { drive_state, vehicle_state, charge_state } = vehicleData.toJSON() as IVehicleData;
      const { charge_energy_added } = charge_state;
      const additionalData: Record<string, AggregateOptions | number> = {
        'sessionData.startingBatteryLevel': { $ifNull: ['$sessionData.startingBatteryLevel', charge_state.battery_level] },
        'sessionData.endingBatteryLevel': charge_state.battery_level,
        'sessionData.duration': {
          $subtract: [drive_state.timestamp, { $toLong: '$createdAt' }],
        },
      };

      if (type === SessionType['drive']) {
        additionalData['sessionData.maxSpeed'] = { $max: ['$sessionData.maxSpeed', drive_state.speed] };
        additionalData['sessionData.maxPower'] = { $max: ['$sessionData.maxPower', drive_state.power] };
        additionalData['sessionData.maxRegen'] = { $min: ['$sessionData.maxRegen', drive_state.power] };
        additionalData['sessionData.startingMilage'] = { $ifNull: ['$sessionData.startingMilage', vehicle_state.odometer] };
        additionalData['sessionData.distance'] = { $subtract: [vehicle_state.odometer, '$sessionData.startingMilage'] };
      }

      if (type === SessionType['charge']) {
        additionalData['sessionData.energyAdded'] = { $max: ['$sessionData.energyAdded', charge_energy_added] };
        additionalData['sessionData.maxChargeRate'] = { $max: ['$sessionData.maxChargeRate', charge_state.charger_power] };
      }

      session = await Session.findOneAndUpdate(
        query,
        [
          {
            $set: {
              ...additionalData,
              user: { $ifNull: ['$user', new mongoose.Types.ObjectId(user)] },
              type: { $ifNull: ['$type', type] },
              vehicle: { $ifNull: ['$vehicle', new mongoose.Types.ObjectId(vehicle)] },
              startLocation: {
                $ifNull: ['$startLocation', { type: 'Point', coordinates: [drive_state.longitude, drive_state.latitude] }],
              },
              metadata: {
                $ifNull: [
                  '$metadata',
                  {
                    interval,
                  },
                ],
              },
              createdAt: { $ifNull: ['$createdAt', new Date(drive_state.timestamp)] },
              updatedAt: new Date(drive_state.timestamp),
              // endLocation will only change on drive sessions
              endLocation: { type: 'Point', coordinates: [drive_state.longitude, drive_state.latitude] },
              dataPoints: {
                $cond: [
                  {
                    $isArray: '$dataPoints',
                  },
                  {
                    $concatArrays: ['$dataPoints', [new mongoose.Types.ObjectId(vehicleData._id)]],
                  },
                  [new mongoose.Types.ObjectId(vehicleData._id)],
                ],
              },
            },
          },
        ],
        { upsert: true, new: true, select: '_id createdAt updatedAt' }
      );

      // we only need to cache idle sessions
      if (type === SessionType['idle']) {
        const cacheKey = buildCacheKey(vehicle, `${SessionType[type]}-session`);
        await cacheService.setCache(cacheKey, session, 60);
      }

      break;
    }

    default: {
      throw new Error(`Unhandled session type: '${type}'`);
    }
  }

  const endTime = performance.now();

  logger.info(
    `${
      new Date(session.createdAt).getTime() - new Date(session.updatedAt).getTime() === 0 ? 'inserted' : 'updated'
    } session`,
    {
      _id: session._id,
      vehicle,
      type: SessionType[type],
    }
  );

  logger.debug(`call to upsertSessionById took ${endTime - startTime} milliseconds`);
  return session;
};

export default {
  upsertSessionById,
};
