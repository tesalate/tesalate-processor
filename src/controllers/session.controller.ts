import { Document } from 'mongoose';

import Logger from '../config/logger';
import { sessionService } from '../services';
import { SessionType } from '../models/session.model';

const logger = Logger('session.controller');

const upsertSession = async (
  _id: string | null | undefined,
  user: string,
  vehicle: string,
  type: SessionType,
  vehicleData?: Document
) => {
  try {
    const session = await sessionService.upsertSessionById(_id, user, vehicle, type, vehicleData);
    return session;
  } catch (error) {
    logger.error(`error updating ${type} session`, error);
    throw error;
  }
};

export default {
  upsertSession,
};
