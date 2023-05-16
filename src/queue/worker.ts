import { Job, Worker } from 'bullmq';
import isEmpty from 'lodash/isEmpty';

import config from '../config/config';
import { getJobInstance } from './provider';
import { JobImp } from './jobs/job.definition';
import { cacheService } from '../services';
import Logger from '../config/logger';

const logger = Logger('worker');

export interface WorkerReply {
  message: unknown;
}

export const primaryInstanceCacheKey = 'primary-active';

export const defaultWorker = (queueName: string) => {
  const worker = new Worker<JobImp, WorkerReply>(
    queueName,
    async (job: Job) => {
      const instance = getJobInstance(job.data);
      if (isEmpty(instance)) {
        throw new Error(`Unable to find Job: ${job.data.name}`);
      }

      await instance.handle(job);

      return { message: 'success' };
    },
    {
      autorun: config.queue.primaryInstance,
      connection: config.redis,
      concurrency: config.queue.workers,
    }
  );
  worker.on('failed', async (job: Job<JobImp, WorkerReply, string> | undefined, error: Error, _prev: string) => {
    if (job) {
      const instance = getJobInstance(job.data);
      instance?.failed(job);
      logger.error(`${job.id} has failed`);
    } else {
      logger.error(`Job failed with error: ${error.message}`);
    }
  });
  worker.on('active', async () => {
    logger.info('worker is active');
    return await worker.resume();
  });
  worker.on('paused', async () => {
    logger.info('pausing worker');
    if (config.queue.primaryInstance) await worker.resume();
  });
  worker.on('progress', async () => await worker.resume());
  worker.on('completed', async () => {
    if (config.queue.primaryInstance) {
      await cacheService.setCache(primaryInstanceCacheKey, true, config.queue.jobInterval * 2);
    }
  });
  return worker;
};
