import { QueueEvents } from 'bullmq';
import Logger from '../config/logger';
import { connection } from './config';
import { defaultQueueName } from './queue';

const logger = Logger('notification');

export const defaultNotification = (queueName: string = defaultQueueName): InstanceType<typeof QueueEvents> => {
  const events: InstanceType<typeof QueueEvents> = new QueueEvents(queueName, { connection });

  events.on('waiting', (args: { jobId: string }) => logger.info(`job ${args.jobId} is waiting`));
  events.on('progress', (args: { jobId: string }) => logger.info(`job ${args.jobId} in progress`));
  events.on('completed', (args: { jobId: string }) => logger.info(`job ${args.jobId} is completed`));
  events.on('removed', (args: { jobId: string }) => logger.info(`job ${args.jobId} is removed`));
  events.on('failed', (args: { jobId: string }) => logger.error(`job ${args.jobId} is failed`));
  events.on('error', (_err: globalThis.Error) => logger.error(`job ${events.name} is error`, _err));

  return events;
};
