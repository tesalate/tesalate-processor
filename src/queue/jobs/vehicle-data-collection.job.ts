/** PACKAGE IMPORTS **/
import { Job } from 'bullmq';
import isEmpty from 'lodash/isEmpty';
import { getDistance } from 'geolib';
import { performance } from 'perf_hooks';

/** CONTROLLER LEVEL IMPORTS **/
import {
  cacheController,
  teslaController,
  sessionController,
  vehicleController,
  mapPointController,
  vehicleDataController,
  teslaAccountController,
  dataCollectorController,
} from '../../controllers';
import { JobImp, BaseJob } from './job.definition';

/** SERVICE LEVEL IMPORTS **/
import { loops, key as loopKey, Values } from '../../services/dataCollector.service';

/** TYPE IMPORTS **/
import { SessionType } from '../../models/session.model';
import { IJobData, IVehicleJobPayload } from '../../models/types';

/** UTIL and CONFIG IMPORTS **/
import Logger from '../../config/logger';
import { buildCacheKey } from '../../utils/formatFuncs';

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

  const sleepSessionCacheKey = `${vehicle._id}:${SessionType['sleep']}-session`;
  /*
   * if vehicle state from tesla does not match vehicle state
   * stored in db, update the db vehicle state
   */
  if (state !== vehicle.state) await vehicleController.updateVehicle(_id, { ...foundVehicle });

  switch (state.toLowerCase()) {
    case 'online': {
      // if vehicle is online, switch to inner loop
      await cacheController.deleteCacheByKey(sleepSessionCacheKey);
      await dataCollectorController.setLoop(vehicle._id, loops.inner);
      logger.info(state, { ...baseLogObj });
      break;
    }

    case 'asleep': {
      // if vehicle is offline, continue on outer loop and create or update sleep session
      const sleepSessionFromCache = await cacheController.getCache(sleepSessionCacheKey);
      const sleepSession = await sessionController.upsertSession(
        sleepSessionFromCache?._id,
        vehicle.user,
        vehicle._id,
        SessionType['sleep']
      );

      await dataCollectorController.setLoopExpiration(vehicle._id);
      logger.info(state, { ...baseLogObj, session: sleepSession?._id, sessionType: SessionType['sleep'] });
      break;
    }

    case 'offline': {
      // if vehicle is offline, continue on outer loop
      await dataCollectorController.setLoopExpiration(vehicle._id);
      await cacheController.deleteCacheByKey(sleepSessionCacheKey);
      logger.info(state, { ...baseLogObj });
      break;
    }

    default: {
      /*
       * at the moment tesla states are only 'online', 'asleep', or 'offline'
       * if the default case if hit, tesla has implemented a new state
       */
      logger.warn('unhandled state', { ...baseLogObj, state });
      await dataCollectorController.setLoopExpiration(vehicle._id);
      break;
    }
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
  const { is_preconditioning, is_climate_on, climate_keeper_mode, cabin_overheat_protection_actively_cooling } =
    climate_state;
  const { center_display_state, sentry_mode } = vehicle_state;
  const { shift_state, longitude, latitude } = drive_state;
  const { charging_state } = charge_state;

  /* CENTER DISPLAY STATES <center_display_state>
   * 0 Off
   * 2 On, standby or Camp Mode
   * 3 On, charging screen
   * 4 On
   * 5 On, Big charging screen consolidate
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
  const newDataPoint = await vehicleDataController.createVehicleData(vehicleData);
  await mapPointController.saveMapPoint(newDataPoint);

  /*
   * create a new sentry, conditioning, or charge session if vehicle has moved since last session
   * this can happen when the vehicle moves while the processor is offline
   * this is unlikely in prod but more of a safe guard
   */
  const vehicleHasMoved = getDistance(lastSavedDataPoint!.drive_state, { latitude, longitude }) > 10;

  let idle = true;

  /******** SENTRY SESSION ********/
  if (sentry_mode) {
    idle = false;
    const id = vehicleHasMoved ? null : lastSavedDataPoint?.sentry_session_id;
    const currentSentrySession = await sessionController.upsertSession(
      id,
      vehicle.user,
      vehicle._id,
      SessionType['sentry'],
      newDataPoint
    );

    newDataPoint.sentry_session_id = currentSentrySession._id;

    logger.debug('sentry session', {
      ...baseLogObj,
      is_preconditioning,
    });
  }

  /******** CONDITIONING SESSION ********/
  /* is the car's hvac system on while the car is parked? */
  /* CLIMATE_KEEPER_MODE states [ 'camp', 'dog', 'off', 'on' ] */
  if (
    ['camp', 'dog', 'on'].includes(climate_keeper_mode) ||
    cabin_overheat_protection_actively_cooling ||
    is_preconditioning
  ) {
    idle = false;
    const id = vehicleHasMoved ? null : lastSavedDataPoint?.conditioning_session_id;
    const currentConditioningSession = await sessionController.upsertSession(
      id,
      vehicle.user,
      vehicle._id,
      SessionType['conditioning'],
      newDataPoint
    );

    newDataPoint.conditioning_session_id = currentConditioningSession._id;

    logger.debug('conditioning session', {
      ...baseLogObj,
      is_climate_on,
      is_preconditioning,
      climate_keeper_mode,
      center_display_state,
    });
  }

  /******** DRIVE SESSION ********/
  /* SHIFT_STATE states [ null, P, R, N, D ] */
  if (['p', 'r', 'n', 'd'].includes(shift_state_lower as string)) {
    idle = false;
    const currentDriveSession = await sessionController.upsertSession(
      lastSavedDataPoint?.drive_session_id,
      vehicle.user,
      vehicle._id,
      SessionType['drive'],
      newDataPoint
    );

    newDataPoint.drive_session_id = currentDriveSession._id;

    logger.debug('drive session', {
      ...baseLogObj,
      shift_state,
    });
  }

  /******** CHARGE SESSION ********/
  /* CHARGE_STATE states [ Charging, Complete, Disconnected, NoPower, Starting, Stopped ] */
  if (['charging', 'complete', 'nopower', 'starting', 'stopped'].includes(charging_state_lower)) {
    idle = false;
    const id = vehicleHasMoved ? null : lastSavedDataPoint?.charge_session_id;
    const currentChargeSession = await sessionController.upsertSession(
      id,
      vehicle.user,
      vehicle._id,
      SessionType['charge'],
      newDataPoint
    );

    newDataPoint.charge_session_id = currentChargeSession._id;

    logger.debug('charge session', {
      ...baseLogObj,
      charging_state,
    });
  }

  /* car is parked and nothing is keeping it awake */
  if (idle) {
    const id = vehicleHasMoved ? null : lastSavedDataPoint?.idle_session_id;
    const currentIdleSession = await sessionController.upsertSession(
      id,
      vehicle.user,
      vehicle._id,
      SessionType['idle'],
      newDataPoint
    );

    newDataPoint.idle_session_id = currentIdleSession._id;

    logger.debug('idle session', {
      ...baseLogObj,
    });
  }

  await vehicleDataController.saveVehicleData(newDataPoint);
};
/** END LOOPS **/

/** JOB **/
export class VehicleDataCollection extends BaseJob implements JobImp {
  constructor(public payload: IVehicleJobPayload) {
    super();
  }

  handle = async (job: Job): Promise<void> => {
    const startTime = performance.now();

    const _id = this.payload.vehicle;
    const vehicle = await vehicleController.getVehicle(_id);
    if (!vehicle || isEmpty(vehicle)) throw new Error('Missing vehicle');
    const { teslaAccount: taID, id_s } = vehicle;

    const teslaAccount = await teslaAccountController.getTeslaAccount(taID, _id);

    // handle error cases
    if (!teslaAccount || isEmpty(teslaAccount)) throw new Error('Missing tesla account');
    if (!teslaAccount.access_token || typeof teslaAccount.access_token !== 'string')
      throw new Error('Missing or bad access token');
    if (!id_s || typeof id_s !== 'string') throw new Error('Missing or bad id_s');

    const loopCacheKey = buildCacheKey(_id, loopKey);

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
    logger.debug(`VehicleDataCollection job(${job.id}) took ${performance.now() - startTime} milliseconds`);
  };

  /** HANDLE ERRORS **/
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
