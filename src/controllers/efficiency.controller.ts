import { Document } from 'mongoose';
import Logger from '../config/logger';
import { efficiencyService } from '../services';

const logger = Logger('efficiency.controller');

const upsertEfficiency = async (vehicleData: Document) => {
  try {
    await efficiencyService.upsertEfficiency(vehicleData);
  } catch (error) {
    // log but don't throw error
    logger.error('error upserting efficiency doc', { error });
  }
};

export default {
  upsertEfficiency,
};
