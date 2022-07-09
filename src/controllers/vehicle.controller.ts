import { IVehicle } from '../models/vehicle.model';
import { vehicleService } from '../services';
import Logger from '../config/logger';

const logger = Logger('vehicle.controller');

const getVehicle = async (_id: string) => {
  try {
    const vehicle = await vehicleService.getVehicleById(_id);
    return vehicle;
  } catch (error) {
    logger.error('error getting vehicle by id', error);
    throw error;
  }
};

const updateVehicle = async (_id: string, data: Partial<IVehicle>) => {
  try {
    const vehicle = await vehicleService.updateVehicleById(_id, data);
    return vehicle;
  } catch (error) {
    logger.error('error updating vehicle', error);
    throw error;
  }
};

export default {
  getVehicle,
  updateVehicle,
};
