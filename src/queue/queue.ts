import { Queue, QueueScheduler } from 'bullmq';

import { cacheService } from '../services';
import config from '../config/config';

import { defaultWorker, primaryInstanceCacheKey } from './worker';

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
    // sizeLimit: 5242880,
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 1000 * 1,
    },
  },
});

export async function setupBullMQProcessor(queueName: string = defaultQueueName) {
  const queueScheduler = new QueueScheduler(queueName, {
    connection: { ...config.redis },
  });

  await queueScheduler.waitUntilReady();
  const worker = defaultWorker(queueName);

  if (!config.queue.primaryInstance) {
    setInterval(async () => {
      const active = await cacheService.getCache(primaryInstanceCacheKey);
      if (!active && (!worker.isRunning() || worker.isPaused())) {
        return worker.isPaused() ? worker.resume() : worker.run();
      } else if (active && worker.isRunning()) {
        return worker.pause();
      }
    }, 2000);
  } else {
    await cacheService.setCache(primaryInstanceCacheKey, true, config.queue.jobInterval * 2);
  }
}
