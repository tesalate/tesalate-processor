import { Document } from 'mongoose';
import Logger from '../config/logger';
import { sentrySessionService } from '../services';
import { IVehicleData } from '../models/vehicleData.model';

const logger = Logger('sentrySession.controller');

const createSentrySession = async (vehicleData: IVehicleData) => {
  try {
    const session = await sentrySessionService.createSentrySession(vehicleData);
    return session;
  } catch (error) {
    logger.error('error creating sentry session', error);
    throw error;
  }
};

const getSentrySession = async (_id: string, vehicle: string) => {
  try {
    const sentrySession = await sentrySessionService.getSentrySessionById(_id, vehicle);
    return sentrySession;
  } catch (error) {
    logger.error('sentry session not found', error);
    throw error;
  }
};

const updateSentrySession = async (_id: string | undefined | null, vehicleData: Document) => {
  try {
    const sentrySession = await sentrySessionService.updateSentrySessionById(_id, vehicleData);
    return sentrySession;
  } catch (error) {
    logger.error('error updating sentry session', error);
    throw error;
  }
};

export default {
  createSentrySession,
  getSentrySession,
  updateSentrySession,
};
