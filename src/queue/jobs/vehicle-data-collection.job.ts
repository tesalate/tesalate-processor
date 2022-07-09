import { Job } from 'bullmq';
import isEmpty from 'lodash/isEmpty';
import mongoose from 'mongoose';
import {
  cacheController,
  teslaController,
  vehicleController,
  vehicleDataController,
  sleepSessionController,
  driveSessionController,
  teslaAccountController,
  chargeSessionController,
  sentrySessionController,
  dataCollectorController,
  conditioningSessionController,
  mapPointController,
} from '../../controllers';
import Logger from '../../config/logger';
import { JobImp, BaseJob } from './job.definition';
import { IJobData, IVehicleJobPayload } from '../../models/types';
import { loops, key as loopKey, Values } from '../../services/dataCollector.service';
import { IDriveSession } from '../..//models/driveSession.model';
import { IChargeSession } from '../../models/chargeSession.model';
import { ISentrySession } from '../../models/sentrySession.model';
import { key as sleepSessionKey } from '../../services/sleepSession.service';
import { ISleepSession } from '../../models/sleepSession.model';
import { buildCacheKey } from '../../utils/formatFuncs';
import { IConditioningSession } from '../../models/conditioningSession.model';
import { IVehicleData } from '../../models/vehicleData.model';

const logger = Logger('vehicle-data-collection.job');

/** LOOPS **/
const handleOuterLoop = async ({ job, teslaAccount, vehicle }: IJobData) => {
  const baseLogObj = { vehicle: vehicle._id, loop: loops.outer };
  await job.updateProgress({ message: 'starting outer loop' });
  const { _id, id_s } = vehicle;

  // get vehicles from tesla '/api/1/vehicles'
  const [foundVehicle] = await teslaController.getVehicles(teslaAccount, _id, id_s);
  if (!foundVehicle || isEmpty(foundVehicle)) throw new Error('Could not find matching vehicle from tesla');

  // stats ['online', 'offline', 'asleep']
  const { state } = foundVehicle;

  const sleepSessionCacheKey = `${vehicle._id}::${sleepSessionKey}`;
  /*
    if vehicle state from tesla does not match vehicle state
    stored in db, update the db vehicle state
  */
  if (state !== vehicle.state) await vehicleController.updateVehicle(_id, { ...foundVehicle });

  switch (state.toLowerCase()) {
    case 'online':
      // if vehicle is online, switch to inner loop
      await cacheController.deleteCacheByKey(sleepSessionCacheKey);
      await dataCollectorController.setLoop(vehicle._id, loops.inner);
      logger.info(state, { ...baseLogObj });
      break;

    case 'asleep': {
      // if vehicle is offline, continue on outer loop and create or update sleep session
      const sleepSessionFromCache = (await cacheController.getCache(sleepSessionCacheKey)) as ISleepSession | undefined;
      let sleepSession;
      if (!sleepSessionFromCache) {
        sleepSession = await sleepSessionController.createSleepSession(vehicle);
      } else {
        sleepSession = await sleepSessionController.updateSleepSession(sleepSessionFromCache._id, vehicle._id, {
          endDate: new Date(),
        });
      }

      await dataCollectorController.setLoopExpiration(vehicle._id);
      logger.info(state, { ...baseLogObj, session: sleepSession?._id });
      break;
    }
    case 'offline':
      // if vehicle is offline, continue on outer loop
      await dataCollectorController.setLoopExpiration(vehicle._id);
      await cacheController.deleteCacheByKey(sleepSessionCacheKey);
      logger.info(state, { ...baseLogObj });
      break;

    default:
      /*
        at the moment tesla states are only 'online', 'asleep', or 'offline'
        if the default case if hit, tesla has implemented a new state
      */
      logger.warn('unhandled state', { ...baseLogObj, state });
      await dataCollectorController.setLoopExpiration(vehicle._id);
      break;
  }
};

const handleInnerLoop = async ({ job, teslaAccount, vehicle }: IJobData) => {
  await job.updateProgress({ message: 'starting inner loop' });
  const baseLogObj = { vehicle: vehicle._id, loop: loops.inner };

  // get vehicle specific data from tesla '/api/1/vehicles/${id_s}/vehicle_data'
  const vehicleData = await teslaController.getVehicleData(teslaAccount, vehicle._id, vehicle.id_s);

  vehicleData.vehicle = vehicle._id;
  vehicleData.user = vehicle.user;

  // destructure all the data from the vehicle <IVehicle> object
  const { charge_state, climate_state, drive_state, vehicle_state } = vehicleData;
  const { is_preconditioning } = climate_state;
  const { shift_state, speed, power, longitude, latitude } = drive_state;
  const { charger_power, charging_state, fast_charger_brand, charge_port_door_open } = charge_state;
  const { center_display_state, sentry_mode, locked, timestamp, odometer } = vehicle_state;
  /* CENTER DISPLAY STATES <center_display_state>
   * 0 Off
   * 2 On, standby or Camp Mode
   * 3 On, charging screen
   * 4 On
   * 5 On, Big charging screen
   * 6 On, Ready to unlock
   * 7 Sentry Mode
   * 8 Dog Mode
   * 9 Media
   */

  // <shift_state> states [ null, 'D', 'N', 'P', 'R' ]
  const shift_state_lower = shift_state?.toLowerCase();

  // <charging_state> states, [ null, Charging, Complete, Disconnected, NoPower, Starting, Stopped ]
  const charging_state_lower = charging_state?.toLowerCase();

  // get the last saved data point for this vehicle
  const lastSavedDataPoint = await vehicleDataController.getLatestVehicleData(vehicle._id);
  const dataPoint = await vehicleDataController.createVehicleData(vehicleData);

  /******** SENTRY SESSION ********/
  if (sentry_mode) {
    let currentSentrySession;

    if (lastSavedDataPoint?.sentry_session_id) {
      logger.debug('GETTING SENTRY SESSION', { session: lastSavedDataPoint.sentry_session_id });

      // if the last saved point has a sentry session id, grab that session from the cache or db
      currentSentrySession = await sentrySessionController.getSentrySession(
        lastSavedDataPoint.sentry_session_id,
        vehicle._id
      );
    }

    if (!currentSentrySession || isEmpty(currentSentrySession)) {
      logger.debug('CREATING SENTRY SESSION');
      // if no sentry session, create one
      currentSentrySession = await sentrySessionController.createSentrySession(vehicleData);
    }

    dataPoint.sentry_session_id = currentSentrySession._id;

    const updateQuery: mongoose.UpdateQuery<ISentrySession> = {
      $set: {
        endDate: new Date(timestamp),
      },
      $push: { dataPoints: dataPoint._id },
    };

    await sentrySessionController.updateSentrySession(currentSentrySession._id, vehicle._id, updateQuery);
    logger.info('sentry session', { ...baseLogObj, is_preconditioning, session: currentSentrySession._id });
  }

  /******** CONDITIONING ********/
  if (is_preconditioning || center_display_state === 8) {
    let currentConditioningSession;

    if (lastSavedDataPoint?.conditioning_session_id) {
      logger.debug('GETTING CONDITIONING SESSION', { session: lastSavedDataPoint.conditioning_session_id });

      // if the last saved point has a conditioning session id, grab that session from the cache or db
      currentConditioningSession = await conditioningSessionController.getConditioningSession(
        lastSavedDataPoint.conditioning_session_id,
        vehicle._id
      );
    }

    if (!currentConditioningSession || isEmpty(currentConditioningSession)) {
      logger.debug('CREATING CONDITIONING SESSION');
      // if no conditioning session, create one
      currentConditioningSession = await conditioningSessionController.createConditioningSession(vehicleData);
    }

    dataPoint.conditioning_session_id = currentConditioningSession._id;

    const updateQuery: mongoose.UpdateQuery<IConditioningSession> = {
      $set: {
        endDate: new Date(timestamp),
      },
      $push: { dataPoints: dataPoint._id },
    };

    await conditioningSessionController.updateConditioningSession(currentConditioningSession._id, vehicle._id, updateQuery);
    logger.info('conditioning session', {
      ...baseLogObj,
      is_preconditioning,
      center_display_state,
      session: currentConditioningSession._id,
    });
  }

  /******** DRIVE SESSION ********/
  if (shift_state_lower === 'd' || shift_state_lower === 'r' || shift_state_lower === 'n') {
    let currentDriveSession;

    if (lastSavedDataPoint?.drive_session_id) {
      logger.debug('GETTING DRIVE SESSION', { session: lastSavedDataPoint.drive_session_id });
      // if the last saved point has a drive session id, grab that session from the cache or db
      currentDriveSession = await driveSessionController.getDriveSession(lastSavedDataPoint.drive_session_id, vehicle._id);
    }

    if (!currentDriveSession || isEmpty(currentDriveSession)) {
      logger.debug('CREATING DRIVE SESSION');
      // if no drive session, create one
      currentDriveSession = await driveSessionController.createDriveSession(vehicleData);
    }

    dataPoint.drive_session_id = currentDriveSession._id;

    const updateQuery: mongoose.UpdateQuery<IDriveSession> = {
      $set: {
        endDate: new Date(timestamp),
        endLocation: { type: 'Point', coordinates: [longitude, latitude] },
      },
      $push: { dataPoints: dataPoint._id },
    };

    await driveSessionController.updateDriveSession(currentDriveSession._id, vehicle._id, updateQuery);
    logger.info('drive session', { ...baseLogObj, shift_state, session: currentDriveSession._id });
  }

  /******** CHARGE SESSION ********/
  /* [ Charging, Complete, Disconnected, NoPower, Starting, Stopped ] */
  if (['charging', 'complete', 'nopower', 'starting', 'stopped'].includes(charging_state_lower)) {
    let currentChargeSession;

    if (lastSavedDataPoint?.charge_session_id) {
      logger.debug('GETTING CHARGE SESSION', { session: lastSavedDataPoint.charge_session_id });
      // if the last saved point has a charge session id, grab that session from the cache or db
      currentChargeSession = await chargeSessionController.getChargeSession(
        lastSavedDataPoint.charge_session_id,
        vehicle._id
      );
    }

    if (!currentChargeSession || isEmpty(currentChargeSession)) {
      logger.debug('CREATING CHARGE SESSION');
      // if no charge session, create one
      currentChargeSession = await chargeSessionController.createChargeSession(vehicleData);
    }

    dataPoint.charge_session_id = currentChargeSession._id;

    const updateQuery: mongoose.UpdateQuery<IChargeSession> = {
      $set: {
        endDate: new Date(timestamp),
      },
      $push: { dataPoints: dataPoint._id },
    };

    await chargeSessionController.updateChargeSession(currentChargeSession._id, vehicle._id, updateQuery);
    logger.info('charge session', {
      ...baseLogObj,
      charging_state,
      session: currentChargeSession._id,
    });
  }

  const data = await vehicleDataController.saveVehicleData(dataPoint);
  await mapPointController.saveMapPoint(data as IVehicleData);
};

/** JOB **/
export class VehicleDataCollection extends BaseJob implements JobImp {
  constructor(public payload: IVehicleJobPayload) {
    super();
  }

  handle = async (job: Job): Promise<void> => {
    const _id = this.payload.vehicle;
    const vehicle = await vehicleController.getVehicle(_id);
    if (!vehicle || isEmpty(vehicle)) throw new Error('Missing vehicle');
    const { teslaAccount: ta, id_s } = vehicle;

    const teslaAccount = await teslaAccountController.getTeslaAccount(ta, _id);

    // handle error cases
    if (!teslaAccount || isEmpty(teslaAccount)) throw new Error('Missing tesla account');
    if (!teslaAccount.access_token || typeof teslaAccount.access_token !== 'string')
      throw new Error('Missing or bad access token');
    if (!id_s || typeof id_s !== 'string') throw new Error('Missing or bad id_s');

    const loopCacheKey = buildCacheKey(_id, '', loopKey);

    // get the current loop from cache; Defaults to outer loop
    const loop = (await dataCollectorController.getLoop(vehicle._id)) as Values;

    const jobData = { job, teslaAccount, vehicle, loopCacheKey } as IJobData;

    loop === loops.outer ? await handleOuterLoop(jobData) : await handleInnerLoop(jobData);
  };

  // all thrown errors are handled here
  failed = async (job: Job): Promise<void> => {
    const _id = this.payload.vehicle;
    // if something errors, delete the cached values for this vehicle
    await cacheController.deleteCacheByPattern(`${_id}:*`);
    logger.error(`Job(${this.name}) with vehicle id ${_id} has failed`, {
      _id,
      message: job.failedReason,
    });
  };
}
