import Redis from 'ioredis';
import config from './config';

const connection = new Redis({ maxRetriesPerRequest: null, enableReadyCheck: false, ...config.redis });

export default connection;
