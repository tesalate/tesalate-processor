import { Job } from 'bullmq';
import axios from 'axios';
import { JobImp, BaseJob } from './job.definition';
import Logger from '../../config/logger';

const logger = Logger('vehicle-data-collection.job');

export class VehicleDataCollection extends BaseJob implements JobImp {
  constructor(public payload: Record<string, unknown>) {
    super();
  }
  handle = async (): Promise<void> => {
    logger.info(`processing job(${this.name})`);
    try {
      const res = await axios.get('https://deelay.me/10000/http://44.233.24.237:4400/health');
      logger.info('RES', res.data);
    } catch (error) {
      logger.error('shit', error);
    }
  };
  failed = (job: Job): void => {
    logger.error(`Job(${this.name}) with ID: ${job.id} has failed`);
  };
}
