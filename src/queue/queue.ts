import { Queue, QueueScheduler } from 'bullmq';
import config from '../config/config';

import { defaultWorker } from './worker';

export const defaultRepeatJobOpts = {
  repeat: {
    every: +config.queue.jobInterval * 1000,
    skipImmediate: true,
  },
  removeOnComplete: true,
  removeOnFail: true,
};

export const defaultQueueName = config.queue.defaultQueueName;

export const defaultQueue = new Queue(defaultQueueName, {
  connection: { ...config.redis },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    sizeLimit: 5242880,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000 * 3,
    },
  },
});

export async function setupBullMQProcessor(queueName: string = defaultQueueName) {
  const queueScheduler = new QueueScheduler(queueName, {
    connection: { ...config.redis },
  });
  await queueScheduler.waitUntilReady();
  defaultWorker(queueName);
}
