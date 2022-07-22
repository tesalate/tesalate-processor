import Logger from '../config/logger';
import { chargerService } from '../services';
import { DriveState } from '../models/vehicleData.model';

const logger = Logger('charger.controller');

const getCharger = async (_id: string) => {
  try {
    const charger = await chargerService.getChargerById(_id);
    return charger;
  } catch (error) {
    logger.error('charger not found', error);
    throw error;
  }
};

const getNearestChargerByDistance = async (drive_state: DriveState, distance: number) => {
  try {
    const charger = await chargerService.getNearestChargerByDistance(drive_state, distance);
    return charger;
  } catch (error) {
    logger.error('charger not found by distance', error);
    throw error;
  }
};

export default {
  getCharger,
  getNearestChargerByDistance,
};
