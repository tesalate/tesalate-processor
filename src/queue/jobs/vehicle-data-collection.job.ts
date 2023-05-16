/** PACKAGE IMPORTS **/
import { Job } from 'bullmq';
import isEmpty from 'lodash/isEmpty';
import { getDistance } from 'geolib';
import { performance } from 'perf_hooks';

/** CONTROLLER LEVEL IMPORTS **/
import {
  vehicleController,
  teslaAccountController,
  dataCollectorController,
  cacheController,
  teslaController,
  sessionController,
  mapPointController,
  vehicleDataController,
  efficiencyController,
} from '../../controllers';
import { JobImp, BaseJob } from './job.definition';

/** SERVICE LEVEL IMPORTS **/
import { loops } from '../../services/dataCollector.service';

/** MODEL LEVEL IMPORTS */
import { SessionType } from '../../models/session.model';
import { IJobData, IVehicleJobPayload } from '../../models/types';
import { IVehicle } from '../../models/vehicle.model';
import { ITeslaAccount } from '../../models/teslaAccount.model';
/** UTIL and CONFIG IMPORTS **/
import Logger from '../../config/logger';
import { buildCacheKey } from '../../utils/formatFuncs';
import config from '../../config/config';

export const logger = Logger('vehicle-data-collection.job');
/** JOB **/
export class VehicleDataCollection extends BaseJob implements JobImp {
  constructor(public payload: IVehicleJobPayload) {
    super();
  }
  /** PUBLIC METHODS **/
  public async handle(job: Job): Promise<void> {
    const startTime = performance.now();

    const jobData = await this.getJobData(this.payload.vehicle);

    await this.handleLoop(job, jobData);

    logger.debug(`VehicleDataCollection job(${job.id}) took ${performance.now() - startTime} milliseconds`);
  }

  public async failed(job: Job): Promise<void> {
    const vehicleId = this.payload.vehicle;

    if (this.isUnrecoverableError(job)) {
      await this.deleteVehicleCache(vehicleId);
    }

    if (this.isVehicleAsleepError(job)) {
      logger.debug('Vehicle is asleep', { vehicleId });
      await this.resetToOuterLoop(vehicleId);
    }

    if (this.isVehicleAsleepError(job)) {
      logger.debug('Vehicle is asleep', { vehicleId });
      await this.resetToOuterLoop(vehicleId);
    }

    logger.error(`Job(${this.name}) with vehicle id ${vehicleId} has failed`, {
      vehicleId,
      failedReason: job.failedReason,
    });
  }

  /** PRIVATE METHODS **/
  private async getJobData(vehicleId: string): Promise<IJobData> {
    const vehicle = await this.getVehicle(vehicleId);

    const teslaAccount = await this.getTeslaAccount(vehicle);

    const loop = await dataCollectorController.getLoop(vehicle._id);

    const jobData = { teslaAccount, vehicle, loop };

    return jobData;
  }

  private async getVehicle(vehicleId: string): Promise<IVehicle> {
    const vehicle = await vehicleController.getVehicle(vehicleId);

    if (!vehicle || isEmpty(vehicle)) {
      throw new Error('Missing vehicle');
    }

    if (!vehicle.id_s || typeof vehicle.id_s !== 'string') {
      throw new Error('Missing or bad id_s');
    }

    return vehicle;
  }

  private async getTeslaAccount(vehicle: IVehicle): Promise<ITeslaAccount> {
    const { teslaAccount: teslaAccountId, _id } = vehicle;
    const teslaAccount = await teslaAccountController.getTeslaAccount(teslaAccountId, _id);

    if (!teslaAccount || isEmpty(teslaAccount)) {
      throw new Error('Missing tesla account');
    }

    if (!teslaAccount.access_token || typeof teslaAccount.access_token !== 'string') {
      throw new Error('Missing or bad access token');
    }
    return teslaAccount;
  }

  private async handleLoop(job: Job, jobData: IJobData): Promise<void> {
    switch (jobData.loop) {
      case loops.outer:
        await this.handleOuterLoop(job, jobData);
        break;

      case loops.inner:
        await this.handleInnerLoop(job, jobData);
        break;

      default:
        logger.error('Unhandled loop case', { loop: jobData.loop });
        break;
    }
  }

  private async resetToOuterLoop(vehicleId: string): Promise<void> {
    await cacheController.deleteCacheByPattern(`${vehicleId}:loop`);
  }

  private async handleInnerLoop(job: Job, jobData: IJobData): Promise<void> {
    const { teslaAccount, vehicle } = jobData;
    await job.updateProgress({ message: 'starting inner loop' });
    const baseLogObj = { vehicle: vehicle._id, loop: loops.inner };
    const jobInterval = Number(job.opts.repeat?.every) / 1000 ?? config.queue.jobInterval;

    // GET VEHICLE DATA FROM TESLA '/api/1/vehicles/${id_s}/vehicle_data'
    const vehicleData = await teslaController.getVehicleData(teslaAccount, vehicle._id, vehicle.id_s);

    vehicleData.vehicle = vehicle._id;
    vehicleData.user = vehicle.user;

    // destructure all the data from the vehicle data response object <IVehicle>
    const { charge_state, climate_state, drive_state, vehicle_state } = vehicleData;
    const { is_preconditioning, is_climate_on, climate_keeper_mode, cabin_overheat_protection_actively_cooling } =
      climate_state;
    const { charging_state, charge_miles_added_ideal, charge_energy_added, charge_limit_soc, charge_miles_added_rated } =
      charge_state;
    const { center_display_state, sentry_mode } = vehicle_state;
    const { shift_state, longitude, latitude } = drive_state;

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
        newDataPoint,
        jobInterval
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
        newDataPoint,
        jobInterval
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
    if (['p', 'r', 'n', 'd'].includes(String(shift_state_lower))) {
      idle = false;
      const currentDriveSession = await sessionController.upsertSession(
        lastSavedDataPoint?.drive_session_id,
        vehicle.user,
        vehicle._id,
        SessionType['drive'],
        newDataPoint,
        jobInterval
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

      /* the following is true when a charge session completes,
       * the vehicle is still plugged in, and the user raises
       * the charge limit state of charge and the car starts a
       * new charge sessions. I think. This whole check could be pointless.
       */
      const teslaStartedNewChargeSession =
        lastSavedDataPoint?.charge_state?.charging_state?.toLowerCase() === 'complete' &&
        lastSavedDataPoint?.charge_state?.charge_limit_soc < charge_limit_soc &&
        lastSavedDataPoint?.charge_state?.charge_miles_added_ideal > 0 &&
        lastSavedDataPoint?.charge_state?.charge_energy_added > 0 &&
        ['charging', 'starting'].includes(charging_state_lower) &&
        charge_miles_added_ideal === 0 &&
        charge_energy_added === 0;

      const id = vehicleHasMoved || teslaStartedNewChargeSession ? null : lastSavedDataPoint?.charge_session_id;

      const currentChargeSession = await sessionController.upsertSession(
        id,
        vehicle.user,
        vehicle._id,
        SessionType['charge'],
        newDataPoint,
        jobInterval
      );

      newDataPoint.charge_session_id = currentChargeSession._id;

      logger.debug('charge session', {
        ...baseLogObj,
        charging_state,
      });
    }

    /******** IDLE SESSION ********/
    /* car is parked and nothing is keeping it awake */
    if (idle) {
      const idleCacheKey = buildCacheKey(vehicle._id, `${SessionType['idle']}-session`);
      const cachedSession = await cacheController.getCache(idleCacheKey);
      const id = vehicleHasMoved || isEmpty(cachedSession) ? null : lastSavedDataPoint?.idle_session_id;
      const currentIdleSession = await sessionController.upsertSession(
        id,
        vehicle.user,
        vehicle._id,
        SessionType['idle'],
        newDataPoint,
        jobInterval
      );

      newDataPoint.idle_session_id = currentIdleSession._id;

      logger.debug('idle session', {
        ...baseLogObj,
      });
    }

    /******** SAVE VEHICLE DATA AND MAP POINT ********/
    await vehicleDataController.saveVehicleData(newDataPoint);
    await mapPointController.saveMapPoint(newDataPoint);

    /******** UPSERT EFFICIENCY ********/
    /* calculating what tesla thinks the vehicle's efficiency is when
     * charge_energy_added is < 1 and charge_miles_added_rated is < 5
     * is not accurate enough so skip the upsert for now
     */
    const saveEff =
      lastSavedDataPoint?.charge_session_id &&
      !newDataPoint.charge_session_id &&
      charge_energy_added >= 1 &&
      charge_miles_added_rated >= 5;

    /* if the last saved data point has a charge session id
     * and the new data point does not have a charge session id
     * that means that the charge session most likely ended
     * and we can upsert the efficiency doc for this vehicle
     */
    if (saveEff) {
      await efficiencyController.upsertEfficiency(newDataPoint);
    }

    logger.debug('efficiency info', {
      ...baseLogObj,
      last: lastSavedDataPoint?.charge_session_id,
      new: newDataPoint.charge_session_id,
      charge_energy_added,
      charge_miles_added_rated,
    });
  }

  private async handleOuterLoop(job: Job, jobData: IJobData): Promise<void> {
    const { teslaAccount, vehicle } = jobData;
    const baseLogObj = { vehicle: vehicle._id, loop: loops.outer };
    await job.updateProgress({ message: 'starting outer loop' });
    const { _id, id_s } = vehicle;
    const jobInterval = Number(job.opts.repeat?.every) / 1000 ?? config.queue.jobInterval;

    // get vehicles from tesla '/api/1/vehicles'
    const [foundVehicle] = await teslaController.getVehicles(teslaAccount, _id, id_s);
    if (!foundVehicle || isEmpty(foundVehicle)) throw new Error('Could not find matching vehicle from tesla');

    // states ['online', 'offline', 'asleep']
    const { state } = foundVehicle;

    const sleepSessionCacheKey = buildCacheKey(vehicle._id, `${SessionType['sleep']}-session`);
    /*
     * if vehicle state from tesla does not match vehicle state
     * stored in db, update the db vehicle state
     */
    if (state !== vehicle.state) await vehicleController.updateVehicle(_id, { ...foundVehicle });

    switch (state.toLowerCase()) {
      // if vehicle is online, switch to inner loop
      case 'online': {
        await cacheController.deleteCacheByKey(sleepSessionCacheKey);
        await dataCollectorController.setLoop(vehicle._id, loops.inner);
        logger.info(state, { ...baseLogObj });
        break;
      }

      // if vehicle is offline, continue on outer loop and create or update sleep session
      case 'asleep': {
        // not sure if this is the best to call del key every time
        const idleCacheKey = buildCacheKey(vehicle._id, `${SessionType['idle']}-session`);
        await cacheController.deleteCacheByKey(idleCacheKey);

        const sleepSessionFromCache = await cacheController.getCache(sleepSessionCacheKey);
        const sleepSession = await sessionController.upsertSession(
          sleepSessionFromCache?._id,
          vehicle.user,
          vehicle._id,
          SessionType['sleep'],
          undefined,
          jobInterval
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
  }

  private async deleteVehicleCache(vehicleId: string): Promise<void> {
    await cacheController.deleteCacheByPattern(`${vehicleId}:*`);
  }

  private isVehicleAsleepError(job: Job): boolean {
    return job.failedReason.toLowerCase().includes('408');
  }
  private isRatelimited(job: Job): boolean {
    return job.failedReason.toLowerCase().includes('429');
  }

  private isUnrecoverableError(job: Job): boolean {
    return job.failedReason.toLowerCase().includes('unrecoverable');
  }
}
