import { Document } from 'mongoose';
import Logger from '../config/logger';
import { conditioningSessionService } from '../services';

const logger = Logger('conditioningSession.controller');

// const createConditioningSession = async (vehicleData: Document) => {
//   try {
//     const session = await conditioningSessionService.createConditioningSession(vehicleData);
//     return session;
//   } catch (error) {
//     logger.error('error creating conditioning session', error);
//     throw error;
//   }
// };

const getConditioningSession = async (_id: string, vehicle: string) => {
  try {
    const conditioningSession = await conditioningSessionService.getConditioningSessionById(_id, vehicle);
    return conditioningSession;
  } catch (error) {
    logger.error('conditioning session not found', error);
    throw error;
  }
};

const updateConditioningSession = async (_id: string | null | undefined, vehicleData: Document) => {
  try {
    const conditioningSession = await conditioningSessionService.updateConditioningSessionById(_id, vehicleData);
    return conditioningSession;
  } catch (error) {
    logger.error('error updating conditioning session', error);
    throw error;
  }
};

export default {
  // createConditioningSession,
  getConditioningSession,
  updateConditioningSession,
};
