import { cacheService } from '../services';
import { buildCacheKey } from '../utils/formatFuncs';

export const ttl = 10 * 60;
export const key = 'loop';
export const loops = {
  outer: 'outer',
  inner: 'inner',
} as const;

type Keys = keyof typeof loops;
export type Values = typeof loops[Keys];

const getLoop = async (vehicle: string): Promise<string> => {
  const cacheKey = buildCacheKey(vehicle, '', key);
  const cachedLoop = await cacheService.getCache(cacheKey);
  if (cachedLoop) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    // strings returned from redis are wrapped in double quotes so we must remove them
    return cachedLoop.replace(/"/gi, '');
  }
  cacheService.setCache(cacheKey, loops.outer, ttl);
  return loops.outer;
};

const setLoop = async (vehicle: string, value: Values) => {
  const cacheKey = buildCacheKey(vehicle, '', key);
  await cacheService.setCache(cacheKey, value, ttl);
};

const setLoopExpiration = async (vehicle: string) => {
  const cacheKey = buildCacheKey(vehicle, '', key);
  await cacheService.setCacheExpire(cacheKey, ttl);
};

export default {
  getLoop,
  setLoop,
  setLoopExpiration,
};
