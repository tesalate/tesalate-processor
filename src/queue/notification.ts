import { QueueEvents } from 'bullmq';
import Logger from '../config/logger';
import { defaultQueueName } from './queue';
import config from '../config/config';

const logger = Logger('notification');

export const defaultNotification = (queueName: string = defaultQueueName): InstanceType<typeof QueueEvents> => {
  const events: InstanceType<typeof QueueEvents> = new QueueEvents(queueName, { connection: config.redis });

  events.on('waiting', (args: { jobId: string }) => logger.info(`job ${args.jobId} is waiting`));
  events.on('progress', (args: { jobId: string; data: unknown }) => logger.info(`job ${args.jobId} in progress`, args.data));
  events.on('completed', (args: { jobId: string }) => logger.info(`job ${args.jobId} is completed`));
  events.on('removed', (args: { jobId: string }) => logger.info(`job ${args.jobId} is removed`));
  events.on('failed', (args: { jobId: string; failedReason: string }) =>
    logger.error(`job ${args.jobId} is failed`, args.failedReason)
  );
  events.on('error', (_err: globalThis.Error) => logger.error(`job ${events.name} is error`, _err));

  return events;
};
