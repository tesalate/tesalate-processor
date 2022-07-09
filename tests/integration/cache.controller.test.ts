import Redis from 'ioredis';
import connection from '../../src/config/redis';
import { cacheController } from '../../src/controllers';

describe('cache integration test', () => {
  let client: Redis;
  const cacheKey = 'key:test';
  const cacheValue = { cache: 'value' };
  beforeAll(() => {
    client = connection;
  });
  afterEach(() => {
    jest.resetAllMocks();
    client.flushall();
  });
  afterAll(() => {
    client.quit();
  });

  it('should set the cache in redis', async () => {
    const res1 = await cacheController.setCache(cacheKey, cacheValue);
    expect(res1).toEqual('OK');
    const res2 = await client.get(cacheKey);
    expect(res2).toEqual(JSON.stringify(cacheValue));
  });

  it('should get the cache value in redis by key', async () => {
    await client.set(cacheKey, JSON.stringify(cacheValue));
    const res = await cacheController.getCache(cacheKey);
    expect(res).toStrictEqual(cacheValue);
  });

  it('should delete the cache in redis by key', async () => {
    await client.set(cacheKey, JSON.stringify(cacheValue));
    const res1 = await client.get(cacheKey);
    expect(res1).toBeDefined();
    const res2 = await cacheController.deleteCacheByKey(cacheKey);
    expect(res2).toBe(1);
    const res3 = await client.get(cacheKey);
    expect(res3).toBeNull();
  });

  it('should hit the catch for delete cache', async () => {
    const res = await cacheController.deleteCacheByKey(undefined as unknown as string);
    expect(res).toBe(undefined);
  });
});
