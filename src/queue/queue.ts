import { Queue, QueueScheduler } from 'bullmq';
import config from '../config/config';

import { connection } from './config';
import { defaultWorker } from './worker';
import { defaultNotification } from './notification';

export const defaultQueueName = config.defaultQueueName;
export const defaultQueue = new Queue(defaultQueueName, {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    sizeLimit: 5242880,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000 * 3,
    },
  },
});

export async function setupBullMQProcessor(queueName: string = defaultQueueName) {
  const queueScheduler = new QueueScheduler(queueName, {
    connection,
  });
  await queueScheduler.waitUntilReady();
  await defaultNotification(queueName);
  await defaultWorker(queueName);
}
