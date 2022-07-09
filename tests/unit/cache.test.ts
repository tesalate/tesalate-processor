import { cacheController } from '../../src/controllers';
import { cacheService } from '../../src/services';

jest.mock('../../src/services');

describe('test unit cache', () => {
  const cacheKey = 'key';
  const cacheValue = { cache: 'value' };
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should set the cache without ttl', async () => {
    const spy = jest.spyOn(cacheService, 'setCache');

    await cacheController.setCache(cacheKey, cacheValue);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual(cacheKey);
    expect(spy.mock.calls[0][1]).toEqual(cacheValue);
    expect(spy.mock.calls[0][2]).toEqual(undefined);
  });

  it('should set the cache with ttl', async () => {
    const ttl = 60;
    const spy = jest.spyOn(cacheService, 'setCache');

    await cacheController.setCache(cacheKey, cacheValue, ttl);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual(cacheKey);
    expect(spy.mock.calls[0][1]).toEqual(cacheValue);
    expect(spy.mock.calls[0][2]).toEqual(ttl);
  });

  it('should get the value from cache', async () => {
    const spy = jest.spyOn(cacheService, 'getCache');

    await cacheController.getCache(cacheKey);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should return the value from the cache', async () => {
    const mockedDependency = jest.mocked(cacheService, true);
    mockedDependency.getCache.mockResolvedValueOnce(JSON.stringify(cacheValue));

    const res = await cacheController.getCache(cacheKey);

    expect(res).toEqual(cacheValue);
  });

  // it('should delete the value from cache', async () => {
  //   const spy = jest.spyOn(cacheService, 'deleteCache');

  //   await cacheController.deleteCache(cacheKey);

  //   expect(spy).toHaveBeenCalledTimes(1);
  //   expect(spy.mock.calls[0][0]).toEqual(cacheKey);
  // });
});
