import { QueueEvents } from 'bullmq';
import Logger from '../config/logger';
import { defaultQueueName } from './queue';
import config from '../config/config';

const logger = Logger('notification');

export const defaultNotification = (queueName: string = defaultQueueName): InstanceType<typeof QueueEvents> => {
  const events: InstanceType<typeof QueueEvents> = new QueueEvents(queueName, { connection: config.redis });

  events.on('waiting', (args: { jobId: string }) => logger.info(`job waiting`, { jobId: args.jobId }));
  events.on('progress', (args: { jobId: string; data: unknown }) =>
    logger.info('job in progress', { data: args.data, jobId: args.jobId })
  );
  events.on('completed', (args: { jobId: string }) => logger.info(`job completed`, { jobId: args.jobId }));
  events.on('removed', (args: { jobId: string }) => logger.info(`job removed`, { jobId: args.jobId }));
  events.on('failed', (args: { jobId: string; failedReason: string }) =>
    logger.error(`job failed`, { data: args.failedReason, jobId: args.jobId })
  );
  events.on('error', (_err: globalThis.Error) => logger.error(`job error`, { error: _err, name: events.name }));

  return events;
};
