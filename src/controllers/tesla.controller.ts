import { AxiosError } from 'axios';
import { UnrecoverableError } from 'bullmq';

import Logger from '../config/logger';
import { ITeslaAccount } from '../models/teslaAccount.model';
import { IVehicleData } from '../models/vehicleData.model';
import { emailService, queueService, teslaService, vehicleService } from '../services';

const logger = Logger('tesla.controller');

const getVehicles = async (teslaAccount: Partial<ITeslaAccount>, vehicle: string, id_s?: string) => {
  try {
    return await teslaService.fetchVehiclesFromTesla(teslaAccount, vehicle, id_s);
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    logger.error('error getting vehicles from tesla', axiosError?.response?.data);
    if (axiosError?.response!.status >= 400 && axiosError?.response?.config.url?.includes('/token')) {
      await emailService.sendDataCollectionStoppedEmail(teslaAccount as ITeslaAccount);
      await queueService.removeVehicleFromQueueByVehicleId(vehicle);
      await vehicleService.updateVehicleById(vehicle, { collectData: false });
      throw new UnrecoverableError('Unrecoverable');
    }
    throw error;
  }
};

const getVehicleData = async (
  teslaAccount: Partial<ITeslaAccount>,
  vehicle: string,
  id_s: string,
  latest = false
): Promise<IVehicleData> => {
  try {
    return await teslaService.fetchVehicleDataFromTesla(teslaAccount, vehicle, id_s, latest);
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('error getting vehicle data from tesla', axiosError?.response);
    if (axiosError?.response!.status >= 400 && axiosError?.response?.config.url?.includes('/token')) {
      await emailService.sendDataCollectionStoppedEmail(teslaAccount as ITeslaAccount);
      await queueService.removeVehicleFromQueueByVehicleId(vehicle);
      await vehicleService.updateVehicleById(vehicle, { collectData: false });
      throw new UnrecoverableError('Unrecoverable');
    }
    throw error;
  }
};

export default {
  getVehicles,
  getVehicleData,
};
