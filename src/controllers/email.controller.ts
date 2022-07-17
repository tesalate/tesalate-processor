import Logger from '../config/logger';
import { emailService } from '../services';
import { ITeslaAccount } from '../models/teslaAccount.model';
import { AxiosError } from 'axios';

const logger = Logger('email.controller');

const sendDataCollectionStoppedEmail = async (teslaAccount: Partial<ITeslaAccount>) => {
  try {
    logger.debug('sending dc stopped email', { teslaAccount });
    await emailService.sendDataCollectionStoppedEmail(teslaAccount);
    logger.debug('sent dc stopped email');
  } catch (error) {
    logger.error('data collection stop email error', { error: (error as AxiosError)?.response?.data });
    throw error;
  }
};

export default {
  sendDataCollectionStoppedEmail,
};
