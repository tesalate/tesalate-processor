import { Job } from 'bullmq';
import { JobImp, BaseJob } from './job.definition';
import { emailController } from '../../controllers';
import { ITeslaAccount } from '../../models/teslaAccount.model';
import Logger from '../../config/logger';

const logger = Logger('data-collection-stopped-email.job');

export class DataCollectionStoppedEmail extends BaseJob implements JobImp {
  constructor(public payload: ITeslaAccount) {
    super();
  }

  handle = async (): Promise<void> => {
    logger.debug('processing dc stopped job');
    await emailController.sendDataCollectionStoppedEmail(this.payload);
    logger.debug('processed dc stopped job');
  };

  // all thrown errors are handled here
  failed = async (job: Job): Promise<void> => {
    logger.error(`Job(${this.name}) with ${job.id} has failed`, {
      message: job.failedReason,
    });
  };
}
