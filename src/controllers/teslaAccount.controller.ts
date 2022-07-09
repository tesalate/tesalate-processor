import Logger from '../config/logger';
import { ITeslaAccount } from '../models/teslaAccount.model';
import { teslaAccountService } from '../services';

const logger = Logger('teslaAccount.controller');

const getTeslaAccount = async (_id: string, vehicle: string) => {
  try {
    const teslaAccount = await teslaAccountService.getTeslaAccountById(_id, vehicle);
    return teslaAccount;
  } catch (error) {
    logger.error('tesla account not found', error);
    throw error;
  }
};

const updateTeslaAccount = async (data: Partial<ITeslaAccount>, vehicle: string) => {
  try {
    const teslaAccount = await teslaAccountService.updateTeslaAccountById(data, vehicle);
    return teslaAccount;
  } catch (error) {
    logger.error('error updating tesla account', error);
    throw error;
  }
};

export default {
  getTeslaAccount,
  updateTeslaAccount,
};
