import mongoose from 'mongoose';
import Logger from '../config/logger';
import { ISleepSession } from '../models/sleepSession.model';
import { sleepSessionService } from '../services';
import { IVehicle } from '../models/vehicle.model';

const logger = Logger('sleepSession.controller');

const createSleepSession = async (vehicle: IVehicle) => {
  try {
    const session = await sleepSessionService.createSleepSession(vehicle);
    return session;
  } catch (error) {
    logger.error('error creating sleep session', error);
    throw error;
  }
};

const getSleepSession = async (_id: string, vehicle: string) => {
  try {
    const sleepSession = await sleepSessionService.getSleepSessionById(_id, vehicle);
    return sleepSession;
  } catch (error) {
    logger.error('sleep session not found', error);
    throw error;
  }
};

const updateSleepSession = async (_id: string, vehicle: string, updateQuery: mongoose.UpdateQuery<ISleepSession>) => {
  try {
    const sleepSession = await sleepSessionService.updateSleepSessionById(_id, vehicle, updateQuery);
    return sleepSession;
  } catch (error) {
    logger.error('error updating sleep session', error);
    throw error;
  }
};

export default {
  createSleepSession,
  getSleepSession,
  updateSleepSession,
};
