import { Document } from 'mongoose';
import Logger from '../config/logger';
import { IVehicleData } from '../models/vehicleData.model';
import { vehicleDataService } from '../services';

const logger = Logger('vehicleData.controller');

const createVehicleData = async (vehicleData: IVehicleData) => {
  try {
    const dataPoint = await vehicleDataService.createVehicleData(vehicleData);
    return dataPoint;
  } catch (error) {
    logger.error('error creating vehicle data/map point', error);
    throw error;
  }
};

const saveVehicleData = async (vehicleData: Document) => {
  try {
    const dataPoint = await vehicleDataService.saveVehicleData(vehicleData);
    return dataPoint;
  } catch (error) {
    logger.error('error creating vehicle data/map point', error);
    throw error;
  }
};

const getLatestVehicleData = async (_id: string) => {
  try {
    const vehicleData = await vehicleDataService.getLatestVehicleDataByVehicleId(_id);
    return vehicleData;
  } catch (error) {
    logger.error('vehicle data not found', error);
    throw error;
  }
};

const updateVehicleData = async (_id: string, vehicleData: IVehicleData) => {
  try {
    const dataPoint = await vehicleDataService.updateVehicleData(_id, vehicleData);
    return dataPoint;
  } catch (error) {
    logger.error('error updating vehicle data', error);
    throw error;
  }
};
export default {
  createVehicleData,
  getLatestVehicleData,
  updateVehicleData,
  saveVehicleData,
};
