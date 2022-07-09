import mongoose, { Schema } from 'mongoose';
import { objectIdToString } from './plugins';
import { GeoJSONPoint } from './types';

export interface IVehicleData {
  _id: string;
  geoJSON: GeoJSONPoint;
  color: unknown;
  tokens: string[];
  backseat_token: unknown;
  backseat_token_updated_at: unknown;
  drive_session_id: string | null;
  charge_session_id: string | null;
  sentry_session_id: string | null;
  conditioning_session_id: string | null;
  id: number;
  user_id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  option_codes: string;
  access_type: string;
  state: string;
  in_service: boolean;
  id_s: string;
  calendar_enabled: boolean;
  api_version: number;
  charge_state: ChargeState;
  climate_state: ClimateState;
  drive_state: DriveState;
  gui_settings: GUISettings;
  vehicle_config: VehicleConfig;
  vehicle_state: VehicleState;
  vehicle: string;
  user: string;
}

export interface ChargeState {
  battery_heater_on: boolean;
  battery_level: number;
  battery_range: number;
  charge_amps: number;
  charge_current_request: number;
  charge_current_request_max: number;
  charge_enable_request: boolean;
  charge_energy_added: number;
  charge_limit_soc: number;
  charge_limit_soc_max: number;
  charge_limit_soc_min: number;
  charge_limit_soc_std: number;
  charge_miles_added_ideal: number;
  charge_miles_added_rated: number;
  charge_port_cold_weather_mode: boolean;
  charge_port_door_open: boolean;
  charge_port_latch: string;
  charge_rate: number;
  charge_to_max_range: boolean;
  charger_actual_current: number;
  charger_phases: number;
  charger_pilot_current: number;
  charger_power: number;
  charger_voltage: number;
  charging_state: string;
  conn_charge_cable: string;
  est_battery_range: number;
  fast_charger_brand: string;
  fast_charger_present: boolean;
  fast_charger_type: string;
  ideal_battery_range: number;
  managed_charging_active: boolean;
  managed_charging_start_time: null;
  managed_charging_user_canceled: boolean;
  max_range_charge_counter: number;
  minutes_to_full_charge: number;
  not_enough_power_to_heat: null;
  off_peak_charging_enabled: boolean;
  off_peak_charging_times: string;
  off_peak_hours_end_time: number;
  preconditioning_enabled: boolean;
  preconditioning_times: string;
  scheduled_charging_mode: string;
  scheduled_charging_pending: boolean;
  scheduled_charging_start_time: null;
  scheduled_charging_start_time_app: number;
  scheduled_departure_time: number;
  scheduled_departure_time_minutes: number;
  supercharger_session_trip_planner: boolean;
  time_to_full_charge: number;
  timestamp: number;
  trip_charging: boolean;
  usable_battery_level: number;
  user_charge_enable_request: null;
}

export interface ClimateState {
  allow_cabin_overheat_protection: boolean;
  auto_seat_climate_left: boolean;
  auto_seat_climate_right: boolean;
  battery_heater: boolean;
  battery_heater_no_power: null;
  cabin_overheat_protection: string;
  cabin_overheat_protection_actively_cooling: boolean;
  climate_keeper_mode: string;
  defrost_mode: number;
  driver_temp_setting: number;
  fan_status: number;
  hvac_auto_request: string;
  inside_temp: number;
  is_auto_conditioning_on: boolean;
  is_climate_on: boolean;
  is_front_defroster_on: boolean;
  is_preconditioning: boolean;
  is_rear_defroster_on: boolean;
  left_temp_direction: number;
  max_avail_temp: number;
  min_avail_temp: number;
  outside_temp: number;
  passenger_temp_setting: number;
  remote_heater_control_enabled: boolean;
  right_temp_direction: number;
  seat_heater_left: number;
  seat_heater_rear_center: number;
  seat_heater_rear_left: number;
  seat_heater_rear_right: number;
  seat_heater_right: number;
  side_mirror_heaters: boolean;
  supports_fan_only_cabin_overheat_protection: boolean;
  timestamp: number;
  wiper_blade_heater: boolean;
}

export interface DriveState {
  gps_as_of: number;
  heading: number;
  latitude: number;
  longitude: number;
  native_latitude: number;
  native_location_supported: number;
  native_longitude: number;
  native_type: string;
  power: number;
  shift_state: null | string;
  speed: number;
  timestamp: number;
}

export interface GUISettings {
  gui_24_hour_time: boolean;
  gui_charge_rate_units: string;
  gui_distance_units: string;
  gui_range_display: string;
  gui_temperature_units: string;
  show_range_units: boolean;
  timestamp: number;
}

export interface VehicleConfig {
  can_accept_navigation_requests: boolean;
  can_actuate_trunks: boolean;
  car_special_type: string;
  car_type: string;
  charge_port_type: string;
  dashcam_clip_save_supported: boolean;
  default_charge_to_max: boolean;
  driver_assist: string;
  ece_restrictions: boolean;
  efficiency_package: string;
  eu_vehicle: boolean;
  exterior_color: string;
  exterior_trim: string;
  has_air_suspension: boolean;
  has_ludicrous_mode: boolean;
  has_seat_cooling: boolean;
  interior_trim_type: string;
  key_version: number;
  motorized_charge_port: boolean;
  performance_package: string;
  plg: boolean;
  pws: boolean;
  rear_drive_unit: string;
  rear_seat_heaters: number;
  rear_seat_type: number;
  rhd: boolean;
  roof_color: string;
  seat_type: null;
  spoiler_type: string;
  sun_roof_installed: null;
  third_row_seats: string;
  timestamp: number;
  trim_badging: string;
  use_range_badging: boolean;
  utc_offset: number;
  webcam_supported: boolean;
  wheel_type: string;
}

export interface VehicleState {
  api_version: number;
  autopark_state_v3: string;
  autopark_style: string;
  calendar_supported: boolean;
  car_version: string;
  center_display_state: number;
  dashcam_clip_save_available: boolean;
  dashcam_state: string;
  df: number;
  dr: number;
  fd_window: number;
  fp_window: number;
  ft: number;
  homelink_device_count: number;
  homelink_nearby: boolean;
  is_user_present: boolean;
  last_autopark_error: string;
  locked: boolean;
  media_state: MediaState;
  notifications_supported: boolean;
  odometer: number;
  parsed_calendar_supported: boolean;
  pf: number;
  pr: number;
  rd_window: number;
  remote_start: boolean;
  remote_start_enabled: boolean;
  remote_start_supported: boolean;
  rp_window: number;
  rt: number;
  santa_mode: number;
  sentry_mode: boolean;
  sentry_mode_available: boolean;
  smart_summon_available: boolean;
  software_update: SoftwareUpdate;
  speed_limit_mode: SpeedLimitMode;
  summon_standby_mode_enabled: boolean;
  timestamp: number;
  valet_mode: boolean;
  vehicle_name: string;
  vehicle_self_test_progress: number;
  vehicle_self_test_requested: boolean;
  webcam_available: boolean;
}

export interface MediaState {
  remote_control_enabled: boolean;
}

export interface SoftwareUpdate {
  download_perc: number;
  expected_duration_sec: number;
  install_perc: number;
  status: string;
  version: string;
}

export interface SpeedLimitMode {
  active: boolean;
  current_limit_mph: number;
  max_limit_mph: number;
  min_limit_mph: number;
  pin_code_set: boolean;
}

const vehicleData = new Schema(
  {
    id: {
      type: Number,
    },
    user_id: {
      type: Number,
    },
    vehicle_id: {
      type: Number,
    },
    vin: {
      type: String,
    },
    display_name: {
      type: String,
    },
    option_codes: {
      type: String,
    },
    color: {
      default: null,
      type: mongoose.Schema.Types.Mixed,
    },
    access_type: {
      type: String,
    },
    tokens: {
      type: [String],
    },
    state: {
      type: String,
    },
    in_service: {
      type: Boolean,
    },
    id_s: {
      type: String,
    },
    calendar_enabled: {
      type: Boolean,
    },
    api_version: {
      type: Number,
    },
    backseat_token: {
      default: null,
      type: mongoose.Schema.Types.Mixed,
    },
    backseat_token_updated_at: {
      default: null,
      type: mongoose.Schema.Types.Mixed,
    },
    charge_state: {
      type: Map,
    },
    climate_state: {
      type: Map,
    },
    drive_state: {
      type: Map,
    },
    gui_settings: {
      type: Map,
    },
    vehicle_config: {
      type: Map,
    },
    vehicle_state: {
      type: Map,
    },
    drive_session_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'DriveSession',
      default: null,
      autopopulate: false,
    },
    charge_session_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'ChargeSession',
      default: null,
      autopopulate: false,
    },
    sentry_session_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'SentrySession',
      default: null,
      autopopulate: false,
    },
    conditioning_session_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'ConditioningSession',
      default: null,
      autopopulate: false,
    },
    geoJSON: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    vehicle: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
vehicleData.plugin(objectIdToString());

vehicleData.index({ _id: -1, vehicle: 1 });

/**
 * @typedef VehicleData
 */
const VehicleData = mongoose.model<IVehicleData>('VehicleData', vehicleData, 'vehicledata');

export default VehicleData;
