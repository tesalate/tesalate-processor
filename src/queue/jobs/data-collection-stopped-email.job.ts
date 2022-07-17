import { Job } from 'bullmq';
import Logger from '../../config/logger';
import { JobImp, BaseJob } from './job.definition';

const logger = Logger('data-collection-stopped-email.job');

export class DataCollectionStoppedEmail extends BaseJob implements JobImp {
  constructor(public payload: Record<string, unknown>) {
    super();
  }

  handle = async (job: Job): Promise<void> => {
    logger.info('JOB', job);
  };

  // all thrown errors are handled here
  failed = async (job: Job): Promise<void> => {
    logger.error(`Job(${this.name}) with ${job.id} has failed`, {
      message: job.failedReason,
    });
  };
}
