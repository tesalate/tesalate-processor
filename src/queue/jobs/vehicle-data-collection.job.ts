import { Job } from 'bullmq';
import isEmpty from 'lodash/isEmpty';
import { getDistance } from 'geolib';
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
import { buildCacheKey } from '../../utils/formatFuncs';
import { ISleepSession } from '../../models/sleepSession.model';
import { IJobData, IVehicleJobPayload } from '../../models/types';
import { key as sleepSessionKey } from '../../services/sleepSession.service';
import { loops, key as loopKey, Values } from '../../services/dataCollector.service';

const logger = Logger('vehicle-data-collection.job');

/** LOOPS **/
const handleOuterLoop = async ({ job, teslaAccount, vehicle }: IJobData) => {
  const baseLogObj = { vehicle: vehicle._id, loop: loops.outer };
  await job.updateProgress({ message: 'starting outer loop' });
  const { _id, id_s } = vehicle;

  // get vehicles from tesla '/api/1/vehicles'
  const [foundVehicle] = await teslaController.getVehicles(teslaAccount, _id, id_s);
  if (!foundVehicle || isEmpty(foundVehicle)) throw new Error('Could not find matching vehicle from tesla');

  // states ['online', 'offline', 'asleep']
  const { state } = foundVehicle;

  const sleepSessionCacheKey = `${vehicle._id}::${sleepSessionKey}`;
  /*
   * if vehicle state from tesla does not match vehicle state
   * stored in db, update the db vehicle state
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
      const sleepSession = await sleepSessionController.updateSleepSession(sleepSessionFromCache?._id, vehicle);

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
       * at the moment tesla states are only 'online', 'asleep', or 'offline'
       * if the default case if hit, tesla has implemented a new state
       */
      logger.warn('unhandled state', { ...baseLogObj, state });
      await dataCollectorController.setLoopExpiration(vehicle._id);
      break;
  }
};

const handleInnerLoop = async ({ job, teslaAccount, vehicle }: IJobData) => {
  await job.updateProgress({ message: 'starting inner loop' });
  const baseLogObj = { vehicle: vehicle._id, loop: loops.inner };

  // GET VEHICLE DATA FROM TESLA '/api/1/vehicles/${id_s}/vehicle_data'
  const vehicleData = await teslaController.getVehicleData(teslaAccount, vehicle._id, vehicle.id_s);

  vehicleData.vehicle = vehicle._id;
  vehicleData.user = vehicle.user;

  // destructure all the data from the vehicle data response object <IVehicle>
  const { charge_state, climate_state, drive_state, vehicle_state } = vehicleData;
  const { center_display_state, sentry_mode } = vehicle_state;
  const { shift_state, longitude, latitude } = drive_state;
  const { is_preconditioning } = climate_state;
  const { charging_state } = charge_state;

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
  await mapPointController.saveMapPoint(dataPoint);

  /*
   * create a new sentry, conditioning, or charge session if vehicle has moved since last session
   * this can happen when the vehicle moves while the data collector is offline
   * this is unlikely in prod but more of a safe guard
   */
  const vehicleHasMoved = getDistance(lastSavedDataPoint!.drive_state, { latitude, longitude }) > 10;

  /******** SENTRY SESSION ********/
  if (sentry_mode) {
    const id = vehicleHasMoved ? null : lastSavedDataPoint?.sentry_session_id;
    const currentSentrySession = await sentrySessionController.updateSentrySession(id, dataPoint);

    dataPoint.sentry_session_id = currentSentrySession._id;

    logger.info('sentry session', { ...baseLogObj, is_preconditioning, session: currentSentrySession._id });
  }

  /******** CONDITIONING ********/
  if (is_preconditioning || center_display_state === 8) {
    const id = vehicleHasMoved ? null : lastSavedDataPoint?.conditioning_session_id;
    const currentConditioningSession = await conditioningSessionController.updateConditioningSession(id, dataPoint);

    dataPoint.conditioning_session_id = currentConditioningSession._id;

    logger.info('conditioning session', {
      ...baseLogObj,
      is_preconditioning,
      center_display_state,
      session: currentConditioningSession._id,
    });
  }

  /******** DRIVE SESSION ********/
  /* DRIVE_STATEs [ null, P, R, N, D ] */
  if (['p', 'r', 'n', 'd'].includes(shift_state_lower as string)) {
    const currentDriveSession = await driveSessionController.updateDriveSession(
      lastSavedDataPoint?.drive_session_id,
      dataPoint
    );

    dataPoint.drive_session_id = currentDriveSession._id;

    logger.info('drive session', { ...baseLogObj, shift_state, session: currentDriveSession._id });
  }

  /******** CHARGE SESSION ********/
  /* CHARGE_STATEs [ Charging, Complete, Disconnected, NoPower, Starting, Stopped ] */
  if (['charging', 'complete', 'nopower', 'starting', 'stopped'].includes(charging_state_lower)) {
    const id = vehicleHasMoved ? null : lastSavedDataPoint?.charge_session_id;
    const currentChargeSession = await chargeSessionController.updateChargeSession(id, dataPoint);

    dataPoint.charge_session_id = currentChargeSession._id;

    logger.info('charge session', {
      ...baseLogObj,
      charging_state,
      session: currentChargeSession._id,
    });
  }

  await vehicleDataController.saveVehicleData(dataPoint);
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

    switch (loop) {
      case loops.outer:
        await handleOuterLoop(jobData);
        break;

      case loops.inner:
        await handleInnerLoop(jobData);
        break;

      default:
        logger.error('Unhandled loop case', { loop });
        break;
    }
  };

  // all thrown errors are handled here
  failed = async (job: Job): Promise<void> => {
    const _id = this.payload.vehicle;
    // if something throws an error, delete the cached values for this vehicle
    await cacheController.deleteCacheByPattern(`${_id}:*`);
    logger.error(`Job(${this.name}) with vehicle id ${_id} has failed`, {
      _id,
      message: job.failedReason,
    });
  };
}
