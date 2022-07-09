import Logger from '../config/logger';
import { cacheService } from '../services';

const logger = Logger('cache.controller');

const getCache = async (key: string): Promise<unknown | null | undefined | void> => {
  try {
    return await cacheService.getCache(key);
  } catch (error) {
    logger.error(`error getting key(${key}) cache`, error);
    return;
  }
};

const setCache = async (key: string, data: unknown, ttl?: number): Promise<string | void> => {
  try {
    const res = await cacheService.setCache(key, data, ttl);
    return res;
  } catch (error) {
    logger.error(`error setting key(${key}) in cache`, error);
    return;
  }
};

const setCacheExpire = async (key: string, ttl?: number): Promise<number | void> => {
  try {
    const res = await cacheService.setCacheExpire(key, ttl);

    return res;
  } catch (error) {
    logger.error(`error setting key(${key}) expiration`, error);
    return;
  }
};

const deleteCacheByKey = async (key: string): Promise<number | void> => {
  try {
    const res = await cacheService.deleteCacheByKey(key);

    return res;
  } catch (error) {
    logger.error(`error deleting key(${key}) from cache`);
    return;
  }
};

const deleteCacheByPattern = async (pattern: string): Promise<number | void> => {
  try {
    const res = await cacheService.deleteCacheByPattern(pattern);
    return res;
  } catch (error) {
    logger.error(`error deleting pattern(${pattern}) from cache`);
    return;
  }
};

export default {
  getCache,
  setCache,
  setCacheExpire,
  deleteCacheByKey,
  deleteCacheByPattern,
};
