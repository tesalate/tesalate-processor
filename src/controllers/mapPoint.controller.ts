import Logger from '../config/logger';
import { mapPointService } from '../services';
import { IVehicleData } from '../models/vehicleData.model';

const logger = Logger('mapPoint.controller');

const saveMapPoint = async (vehicleData: IVehicleData) => {
  try {
    const mapPoint = await mapPointService.saveMapPoint(vehicleData);
    return mapPoint;
  } catch (error) {
    // fail without throwing error
    logger.error('error saving map point', error);
  }
};

export default {
  saveMapPoint,
};
