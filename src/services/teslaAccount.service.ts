import pick from 'lodash/pick';
import { TeslaAccount } from '../models';
import { cacheService } from '../services';
import { ITeslaAccount } from '../models/teslaAccount.model';
import { buildCacheKey } from '../utils/formatFuncs';

const ttl = 60;
const key = 'tesla-account';
const keys = ['_id', 'access_token', 'refresh_token', 'user'];

const getTeslaAccountById = async (_id: string, vehicle: string): Promise<Partial<ITeslaAccount> | null> => {
  const cacheKey = buildCacheKey(vehicle, _id, key);
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as ITeslaAccount;
  }
  const account = pick(await TeslaAccount.findOne({ _id }), keys);
  if (account) {
    await cacheService.setCache(cacheKey, account, ttl);
  }
  return account;
};

const updateTeslaAccountById = async (
  data: Partial<ITeslaAccount>,
  vehicle: string
): Promise<Partial<ITeslaAccount> | null> => {
  const account = pick(
    await TeslaAccount.findOneAndUpdate({ _id: data._id }, { ...data }, { upsert: true, new: true }),
    keys
  );
  const cacheKey = buildCacheKey(vehicle, account._id as string, key);

  if (account) {
    await cacheService.setCache(cacheKey, account, ttl);
  }
  return account;
};

export default {
  getTeslaAccountById,
  updateTeslaAccountById,
};
