import Logger from '../config/logger';
import config from '../config/config';
import connection from '../config/redis';

const logger = Logger('cache.service');

const redisClient = connection;

const getCache = async (key: string): Promise<string | null | undefined> => {
  logger.debug(`getting key(${key}) from cache`);
  const data = await redisClient.get(key);
  if (data) {
    logger.debug(`found key(${key}) in cache`);
    return JSON.parse(data);
  }
  logger.debug(`did not find key(${key}) in cache`);
  return undefined;
};

const setCache = async (key: string, data: unknown, ttl?: number): Promise<string> => {
  logger.debug(`setting key(${key}) in cache`);
  const res = await redisClient.setex(key, ttl ?? config.cache.ttl, JSON.stringify(data));
  logger.debug(`set key(${key}) in cache`);
  return res;
};

const setCacheExpire = async (key: string, ttl?: number): Promise<number> => {
  logger.debug(`setting key(${key}) expiration in cache`);
  const res = await redisClient.expire(key, ttl ?? config.cache.ttl);
  logger.debug(`set key(${key}) to expire in ${ttl} seconds`);
  return res;
};

const deleteCacheByKey = async (key: string): Promise<number> => {
  logger.debug(`deleting key(${key}) from cache`);
  const res = await redisClient.del(key);
  logger.debug(`deleted key(${key}) from cache: ${res}`);
  return res;
};

const deleteCacheByPattern = async (pattern: string): Promise<number> => {
  logger.debug(`deleting pattern(${pattern}) from cache`);
  const keys = await redisClient.keys(pattern);

  if (keys.length > 0) {
    logger.debug(`deleted ${keys.length} keys with the patter(${pattern}) from cache`);
    return await redisClient.del(keys);
  }
  logger.debug(`no keys with the patter(${pattern}) found in cache`);

  return 0;
};

export default { getCache, setCache, setCacheExpire, deleteCacheByKey, deleteCacheByPattern };
