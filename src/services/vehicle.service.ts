import { cacheService } from '../services';
import { Vehicle } from '../models';
import { IVehicle } from '../models/vehicle.model';
import { FilterQuery } from 'mongoose';
import { buildCacheKey } from '../utils/formatFuncs';

const ttl = 60;
const key = 'vehicle';

const getVehicles = async (filter: FilterQuery<IVehicle>): Promise<IVehicle[]> => {
  const res = await Vehicle.find(filter);
  return res;
};

const getVehicleById = async (_id: string): Promise<IVehicle | null> => {
  const cacheKey = buildCacheKey(_id, '', key);
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as IVehicle;
  }
  const vehicle = await Vehicle.findOne({ _id });
  if (vehicle) {
    await cacheService.setCache(cacheKey, vehicle, ttl);
  }
  return vehicle;
};

const updateVehicleById = async (_id: string, data: Partial<IVehicle>): Promise<IVehicle | null> => {
  const cacheKey = buildCacheKey(_id, '', key);
  const vehicle = await Vehicle.findOneAndUpdate({ _id }, { ...data }, { upsert: true, new: true });
  if (vehicle) {
    await cacheService.setCache(cacheKey, vehicle, ttl);
  }
  return vehicle;
};

export default {
  getVehicles,
  getVehicleById,
  updateVehicleById,
};
