import { Document, FlattenMaps, _LeanDocument } from 'mongoose';
import { performance } from 'perf_hooks';

import { cacheService } from '../services';
import { VehicleData } from '../models';
import { IVehicleData } from '../models/vehicleData.model';
import { buildCacheKey } from '../utils/formatFuncs';
import { GeoJSONType } from '..//models/types';

import Logger from '../config/logger';

const logger = Logger('vehicleData.service');
const key = 'latest';
const ttl = 60 * 30; // 30 minutes

const createVehicleData = async (vehicleData: IVehicleData) => {
  const { drive_state, vehicle, user } = vehicleData;
  logger.debug('creating vehicle data point', { vehicle });

  return new VehicleData({
    ...vehicleData,
    geoJSON: {
      type: 'Point' as GeoJSONType,
      coordinates: [drive_state.longitude, drive_state.latitude],
    },
    vehicle,
    user,
  });
};

const cacheLatestDataPointForUI = async (dataObj: { vehicle: string; user: string }) => {
  // This is to set the most recent data point in the cache for the frontend to use
  // Not happy about it
  const uiLatestCacheKey = JSON.stringify({
    vehicle: dataObj.vehicle,
    user: dataObj.user,
    sortBy: '$natural:desc',
    limit: 1,
  });
  const uiLatestCachedValue = await cacheService.getCache(uiLatestCacheKey);
  let count;
  if (!uiLatestCachedValue.totalResults) {
    logger.debug(`calling db for vehicle(${dataObj.vehicle}) total document count`);
    count = await VehicleData.count({ vehicle: dataObj.vehicle });
  } else {
    logger.debug(`using cached value for vehicle(${dataObj.vehicle}) total document count`);
    count = uiLatestCachedValue.totalResults + 1;
  }
  await cacheService.setCache(uiLatestCacheKey, { results: [dataObj], totalResults: count }, 60 * 60 * 24);
};

const saveVehicleData = async (vehicleData: Document) => {
  const startTime = performance.now();
  logger.debug('creating vehicle data point', { _id: vehicleData._id });
  const data = await vehicleData.save();
  const dataObj = data.toJSON();
  logger.debug('saved data point', { _id: dataObj._id, vehicle: dataObj.vehicle });
  const cacheKey = buildCacheKey(dataObj.vehicle, key);
  await cacheService.setCache(cacheKey, dataObj, ttl);

  await cacheLatestDataPointForUI(dataObj as { vehicle: string; user: string });
  logger.debug(`call to saveVehicleData() took ${performance.now() - startTime} milliseconds`);

  return data;
};

const getLatestVehicleDataByVehicleId = async (vehicle: string): Promise<IVehicleData | null> => {
  const cacheKey = buildCacheKey(vehicle, key);
  const cachedValue = await cacheService.getCache(cacheKey);
  if (cachedValue) {
    await cacheService.setCacheExpire(cacheKey, ttl);
    return cachedValue as unknown as IVehicleData;
  }
  logger.debug('getting latest vehicle data point from db');
  const data = await VehicleData.findOne({ vehicle }, {}, { sort: { _id: -1 } }).lean();

  if (data) {
    logger.debug('got latest vehicle data point from db', { _id: data._id });
    await cacheService.setCache(cacheKey, data);
  }
  return data;
};

const updateVehicleData = async (_id: string, vehicleData: IVehicleData): Promise<IVehicleData> => {
  const cacheKey = buildCacheKey(vehicleData._id, key);
  logger.debug('updating vehicle data point', { _id });
  const data = await VehicleData.findOneAndUpdate({ _id }, vehicleData, { upsert: true, new: true });
  logger.debug('updated vehicle data point', { _id: data._id });
  await cacheService.setCache(cacheKey, data, ttl);
  return data;
};

export default {
  createVehicleData,
  getLatestVehicleDataByVehicleId,
  updateVehicleData,
  saveVehicleData,
};
