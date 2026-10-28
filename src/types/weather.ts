/**
 * Weather-related TypeScript types
 * Based on Open-Meteo API response structure
 */

export interface WeatherCodeInfo {
  code: number;
  description: string;
  icon: string; // Lucide icon name
  isDay?: boolean;
}

export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  time: string;
  relativehumidity_2m?: number;
  apparent_temperature?: number;
  precipitation?: number;
  surface_pressure?: number;
  uv_index?: number;
  visibility?: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  relativehumidity_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weathercode: number[];
  windspeed_10m: number[];
  winddirection_10m: number[];
  uv_index?: number[];
  visibility?: number[];
}

export interface DailyForecast {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  windspeed_10m_max: number[];
  winddirection_10m_dominant: number[];
  uv_index_max?: number[];
  sunrise?: string[];
  sunset?: string[];
}

export interface WeatherData {
  current_weather: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  timezone: string;
  timezone_abbreviation: string;
  latitude: number;
  longitude: number;
  elevation: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
}

export interface ProcessedHourlyData {
  time: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  uvIndex?: number;
  visibility?: number;
}

export interface ProcessedDailyData {
  date: Date;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  feelsLikeMax: number;
  feelsLikeMin: number;
  precipitationSum: number;
  precipitationProbability: number;
  windSpeedMax: number;
  windDirection: number;
  uvIndexMax?: number;
  sunrise?: Date;
  sunset?: Date;
}

export interface WeatherState {
  current: CurrentWeather | null;
  hourly: ProcessedHourlyData[];
  daily: ProcessedDailyData[];
  location: LocationInfo | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isMockData: boolean;
}

export interface LocationInfo {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  country: string;
  admin1?: string;
  admin2?: string;
  isCurrentLocation?: boolean;
}