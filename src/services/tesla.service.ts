import axios from '../config/axios';
import { performance } from 'perf_hooks';

import Logger from '../config/logger';
import { TeslaVehiclesResponse } from '../models/types.d';
import { IVehicleData } from '../models/vehicleData.model';
import { ITeslaAccount } from '../models/teslaAccount.model';

const logger = Logger('tesla.service');
const { ownerApi } = axios;

const fetchVehiclesFromTesla = async (
  teslaAccount: Partial<ITeslaAccount>,
  vehicle: string,
  id_s?: string
): Promise<TeslaVehiclesResponse[]> => {
  const startTime = performance.now();
  const {
    data: { response },
  } = await ownerApi.get('/api/1/vehicles', {
    headers: {
      Authorization: `Bearer ${teslaAccount.access_token}`,
      'x-teslaAccount': JSON.stringify(teslaAccount),
      'x-vehicle': vehicle,
    },
  });
  const res = id_s ? response.filter((curr: TeslaVehiclesResponse) => curr.id_s === id_s) : response;
  const endTime = performance.now();
  logger.debug(`call to fetchVehiclesFromTesla took ${endTime - startTime} milliseconds`);
  return res;
};

const fetchVehicleDataFromTesla = async (
  teslaAccount: Partial<ITeslaAccount>,
  vehicle: string,
  id_s: string
): Promise<IVehicleData> => {
  const startTime = performance.now();

  const {
    data: { response },
  } = await ownerApi.get(`/api/1/vehicles/${id_s}/vehicle_data`, {
    headers: {
      Authorization: `Bearer ${teslaAccount.access_token}`,
      'x-teslaAccount': JSON.stringify(teslaAccount),
      'x-vehicle': vehicle,
    },
  });
  const endTime = performance.now();
  logger.debug(`call to fetchVehicleDataFromTesla took ${endTime - startTime} milliseconds`);
  return response;
};

export default {
  fetchVehiclesFromTesla,
  fetchVehicleDataFromTesla,
};
