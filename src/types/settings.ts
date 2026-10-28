/**
 * Settings-related TypeScript types
 */

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'ms' | 'kmh' | 'mph';
export type PrecipitationUnit = 'mm' | 'inch';

export interface UserSettings {
  temperatureUnit: TemperatureUnit;
  windSpeedUnit: WindSpeedUnit;
  precipitationUnit: PrecipitationUnit;
  useGeolocation: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  showUVIndex: boolean;
  use24Hour: boolean;
  theme: 'dark' | 'light' | 'system';
}

export const DEFAULT_SETTINGS: UserSettings = {
  temperatureUnit: 'celsius',
  windSpeedUnit: 'kmh',
  precipitationUnit: 'mm',
  useGeolocation: false,
  autoRefresh: false,
  refreshInterval: 30,
  showUVIndex: true,
  use24Hour: false,
  theme: 'dark',
};

export const SETTINGS_STORAGE_KEY = 'weather-advisory-settings';
export const LOCATIONS_STORAGE_KEY = 'weather-advisory-locations';
export const LAST_LOCATION_STORAGE_KEY = 'weather-advisory-last-location';