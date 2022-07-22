import axios from '../config/axios';
import { TeslaVehiclesResponse } from '../models/types.d';
import { IVehicleData } from '../models/vehicleData.model';
import { ITeslaAccount } from '../models/teslaAccount.model';

const { ownerApi } = axios;

const fetchVehiclesFromTesla = async (
  teslaAccount: Partial<ITeslaAccount>,
  vehicle: string,
  id_s?: string
): Promise<TeslaVehiclesResponse[]> => {
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
  return res;
};

const fetchVehicleDataFromTesla = async (
  teslaAccount: Partial<ITeslaAccount>,
  vehicle: string,
  id_s: string
): Promise<IVehicleData> => {
  const {
    data: { response },
  } = await ownerApi.get(`/api/1/vehicles/${id_s}/vehicle_data`, {
    headers: {
      Authorization: `Bearer ${teslaAccount.access_token}`,
      'x-teslaAccount': JSON.stringify(teslaAccount),
      'x-vehicle': vehicle,
    },
  });
  return response;
};

export default {
  fetchVehiclesFromTesla,
  fetchVehicleDataFromTesla,
};
