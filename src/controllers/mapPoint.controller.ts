import { Document } from 'mongoose';
import Logger from '../config/logger';
import { mapPointService } from '../services';

const logger = Logger('mapPoint.controller');

const saveMapPoint = async (vehicleData: Document) => {
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
