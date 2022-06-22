import { ConnectionOptions } from 'bullmq';
import config from '../config/config';

const { host, port } = config.redis;

export const connection: ConnectionOptions = {
  host,
  port,
};

export const concurrency = config.workers;
