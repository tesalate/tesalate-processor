import Logger from '../config/logger';
import { queueService, teslaService, vehicleService } from '../services';
import { ITeslaAccount } from '../models/teslaAccount.model';
import { AxiosError } from 'axios';
import { IVehicleData } from '../models/vehicleData.model';
import { UnrecoverableError } from 'bullmq';

const logger = Logger('tesla.controller');

const getVehicles = async (teslaAccount: Partial<ITeslaAccount>, vehicle: string, id_s?: string) => {
  try {
    return await teslaService.fetchVehiclesFromTesla(teslaAccount, vehicle, id_s);
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    logger.error('error getting vehicles from tesla', axiosError?.response?.data);
    if (axiosError?.response!.status >= 400 && axiosError?.response?.config.url?.includes('/token')) {
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
  id_s: string
): Promise<IVehicleData> => {
  try {
    return await teslaService.fetchVehicleDataFromTesla(teslaAccount, vehicle, id_s);
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('error getting vehicle data from tesla', axiosError?.response?.data);
    if (axiosError?.response!.status >= 400 && axiosError?.response?.config.url?.includes('/token')) {
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
