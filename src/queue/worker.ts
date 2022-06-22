import { Job, Worker } from 'bullmq';
import isEmpty from 'lodash/isEmpty';

import { connection, concurrency } from './config';
import { getJobInstance } from './provider';
import { JobImp } from './jobs/job.definition';
import Logger from '../config/logger';

const logger = Logger('worker');

export interface WorkerReply {
  message: string;
}

export const defaultWorker = (queueName: string) => {
  const worker = new Worker<JobImp, WorkerReply>(
    queueName,
    async (job: Job) => {
      const instance = getJobInstance(job.data);
      if (isEmpty(instance)) {
        throw new Error(`Unable to find Job: ${job.data.name}`);
      }
      const returnVal = await instance.handle();
      return { message: 'success', returnVal };
    },
    {
      connection,
      concurrency,
      skipDelayCheck: true,
      runRetryDelay: 1000 * 3,
      settings: {
        backoffStrategies: {
          custom(attemptsMade: number) {
            return Math.abs(attemptsMade * 1000);
          },
        },
      },
    }
  );

  worker.on('failed', (job: Job) => {
    const instance = getJobInstance(job.data);
    instance?.failed(job);
    logger.info(`${job.id} has failed`);
  });
  worker.on('active', async () => await worker.resume());
  worker.on('paused', async () => await worker.resume());
  worker.on('progress', async () => await worker.resume());
};
