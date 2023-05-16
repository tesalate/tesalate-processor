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

export const logger = Logger('vehicle-data-collection.job');
/** JOB **/
export class VehicleDataEmail extends BaseJob implements JobImp {
  constructor(public payload: IVehicleJobPayload) {
    super();
  }
  /** PUBLIC METHODS **/
  public async handle(job: Job): Promise<void> {
    return;
  }

  public async failed(job: Job): Promise<void> {
    return;
  }
}
