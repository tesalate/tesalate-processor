import Logger from '../config/logger';
import { IDriveSession } from '../models/driveSession.model';
import mongoose from 'mongoose';
import { driveSessionService } from '../services';
import { IVehicleData } from '../models/vehicleData.model';

const logger = Logger('driveSession.controller');

const createDriveSession = async (vehicleData: IVehicleData) => {
  try {
    const session = await driveSessionService.createDriveSession(vehicleData);
    return session;
  } catch (error) {
    logger.error('error creating drive session', error);
    throw error;
  }
};

const getDriveSession = async (_id: string, vehicle: string) => {
  try {
    const driveSession = await driveSessionService.getDriveSessionById(_id, vehicle);
    return driveSession;
  } catch (error) {
    logger.error('drive session not found', error);
    throw error;
  }
};

const updateDriveSession = async (_id: string, vehicle: string, updateQuery: mongoose.UpdateQuery<IDriveSession>) => {
  try {
    const driveSession = await driveSessionService.updateDriveSessionById(_id, vehicle, updateQuery);
    return driveSession;
  } catch (error) {
    logger.error('error updating drive session', error);
    throw error;
  }
};

export default {
  createDriveSession,
  getDriveSession,
  updateDriveSession,
};
