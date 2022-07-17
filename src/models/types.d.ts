import { IUser } from './user.model';
import { IVehicle } from './vehicle.model';
import { ITeslaAccount } from './teslaAccount.model';

export enum GeoJSONType {
  point = 'Point',
  polygon = 'polygon',
}

export interface GeoJSONPoint {
  type: GeoJSONType;
  coordinates: number[];
}

export interface GeoJSONPolygon {
  type: GeoJSONType;
  coordinates: number[][][];
}

export interface IPaginator {
  paginate(
    filter: unknown,
    options: unknown
  ): {
    results: unknown;
    page: number;
    limit: number;
    totalPages: number;
    totalResults: unknown;
  };
}

export interface IToJSON {
  toJSON(): void;
}

export interface TeslaVehiclesResponse {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  option_codes: string;
  color: unknown;
  tokens: string[];
  state: string;
  in_service: boolean;
  id_s: string;
  calendar_enabled: boolean;
  api_version: number;
  backseat_token: unknown;
  backseat_token_updated_at: unknown;
}

export interface IVehicleDataCollectionPayload extends Omit<IVehicle, '_id' | 'teslaAccount' | 'user'> {
  _id: string;
  teslaAccount: string;
  user: IUser;
}

export type IPartialTeslaAccount = Omit<ITeslaAccount, 'linked' | 'email' | 'createdAt' | 'updatedAt'>;

interface IJobData {
  job: Job;
  teslaAccount: IPartialTeslaAccount;
  vehicle: IVehicle;
  loopCacheKey: string;
}

interface IVehicleJobPayload {
  vehicle: string;
}
