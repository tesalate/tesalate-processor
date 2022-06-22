import { Job } from 'bullmq';
import { JobImp, BaseJob } from './job.definition';
import Logger from '../../config/logger';

const logger = Logger('welcome-email.job');

export class WelcomeEmail extends BaseJob implements JobImp {
  constructor(public payload: Record<string, unknown>) {
    super();
  }
  handle = (): void => {};
  failed = (job: Job): void => {
    logger.error(`Job(${this.name}) with ID: ${job.id} has failed`);
  };
}
