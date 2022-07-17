import mongoose, { Document } from 'mongoose';
import Logger from '../config/logger';
import { IChargeSession } from '../models/chargeSession.model';
import { chargeSessionService } from '../services';
import { IVehicleData } from '../models/vehicleData.model';

const logger = Logger('chargeSession.controller');

const createChargeSession = async (vehicleData: Document) => {
  try {
    const session = await chargeSessionService.createChargeSession(vehicleData);
    return session;
  } catch (error) {
    logger.error('error creating charge session', error);
    throw error;
  }
};

const getChargeSession = async (_id: string, vehicle: string) => {
  try {
    const chargeSession = await chargeSessionService.getChargeSessionById(_id, vehicle);
    return chargeSession;
  } catch (error) {
    logger.error('charge session not found', error);
    throw error;
  }
};

const updateChargeSession = async (_id: string | null | undefined, vehicleData: Document) => {
  try {
    const chargeSession = await chargeSessionService.updateChargeSessionById(_id, vehicleData);
    return chargeSession;
  } catch (error) {
    logger.error('error updating charge session', error);
    throw error;
  }
};

export default {
  createChargeSession,
  getChargeSession,
  updateChargeSession,
};
