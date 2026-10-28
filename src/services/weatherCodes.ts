/**
 * WMO Weather Code Mapping
 * Based on Open-Meteo documentation and WMO weather interpretation codes
 * https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 */

import type { WeatherCodeInfo } from '../types'

export const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { code: 0, description: 'Clear sky', icon: 'sun' },
  1: { code: 1, description: 'Mainly clear', icon: 'sun' },
  2: { code: 2, description: 'Partly cloudy', icon: 'cloud-sun' },
  3: { code: 3, description: 'Overcast', icon: 'cloud' },
  45: { code: 45, description: 'Fog', icon: 'cloud-fog' },
  48: { code: 48, description: 'Depositing rime fog', icon: 'cloud-fog' },
  51: { code: 51, description: 'Light drizzle', icon: 'cloud-drizzle' },
  53: { code: 53, description: 'Moderate drizzle', icon: 'cloud-drizzle' },
  55: { code: 55, description: 'Dense drizzle', icon: 'cloud-drizzle' },
  56: { code: 56, description: 'Light freezing drizzle', icon: 'cloud-drizzle' },
  57: { code: 57, description: 'Dense freezing drizzle', icon: 'cloud-drizzle' },
  61: { code: 61, description: 'Slight rain', icon: 'cloud-rain' },
  63: { code: 63, description: 'Moderate rain', icon: 'cloud-rain' },
  65: { code: 65, description: 'Heavy rain', icon: 'cloud-rain' },
  66: { code: 66, description: 'Light freezing rain', icon: 'cloud-rain' },
  67: { code: 67, description: 'Heavy freezing rain', icon: 'cloud-rain' },
  71: { code: 71, description: 'Slight snow fall', icon: 'cloud-snow' },
  73: { code: 73, description: 'Moderate snow fall', icon: 'cloud-snow' },
  75: { code: 75, description: 'Heavy snow fall', icon: 'cloud-snow' },
  77: { code: 77, description: 'Snow grains', icon: 'cloud-snow' },
  80: { code: 80, description: 'Slight rain showers', icon: 'cloud-rain' },
  81: { code: 81, description: 'Moderate rain showers', icon: 'cloud-rain' },
  82: { code: 82, description: 'Violent rain showers', icon: 'cloud-rain' },
  85: { code: 85, description: 'Slight snow showers', icon: 'cloud-snow' },
  86: { code: 86, description: 'Heavy snow showers', icon: 'cloud-snow' },
  95: { code: 95, description: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { code: 96, description: 'Thunderstorm with slight hail', icon: 'cloud-lightning' },
  99: { code: 99, description: 'Thunderstorm with heavy hail', icon: 'cloud-lightning' },
}

export const NIGHT_WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { code: 0, description: 'Clear sky', icon: 'moon', isDay: false },
  1: { code: 1, description: 'Mainly clear', icon: 'moon', isDay: false },
  2: { code: 2, description: 'Partly cloudy', icon: 'cloud-moon', isDay: false },
  3: { code: 3, description: 'Overcast', icon: 'cloud', isDay: false },
  45: { code: 45, description: 'Fog', icon: 'cloud-fog', isDay: false },
  48: { code: 48, description: 'Depositing rime fog', icon: 'cloud-fog', isDay: false },
  51: { code: 51, description: 'Light drizzle', icon: 'cloud-drizzle', isDay: false },
  53: { code: 53, description: 'Moderate drizzle', icon: 'cloud-drizzle', isDay: false },
  55: { code: 55, description: 'Dense drizzle', icon: 'cloud-drizzle', isDay: false },
  56: { code: 56, description: 'Light freezing drizzle', icon: 'cloud-drizzle', isDay: false },
  57: { code: 57, description: 'Dense freezing drizzle', icon: 'cloud-drizzle', isDay: false },
  61: { code: 61, description: 'Slight rain', icon: 'cloud-rain', isDay: false },
  63: { code: 63, description: 'Moderate rain', icon: 'cloud-rain', isDay: false },
  65: { code: 65, description: 'Heavy rain', icon: 'cloud-rain', isDay: false },
  66: { code: 66, description: 'Light freezing rain', icon: 'cloud-rain', isDay: false },
  67: { code: 67, description: 'Heavy freezing rain', icon: 'cloud-rain', isDay: false },
  71: { code: 71, description: 'Slight snow fall', icon: 'cloud-snow', isDay: false },
  73: { code: 73, description: 'Moderate snow fall', icon: 'cloud-snow', isDay: false },
  75: { code: 75, description: 'Heavy snow fall', icon: 'cloud-snow', isDay: false },
  77: { code: 77, description: 'Snow grains', icon: 'cloud-snow', isDay: false },
  80: { code: 80, description: 'Slight rain showers', icon: 'cloud-rain', isDay: false },
  81: { code: 81, description: 'Moderate rain showers', icon: 'cloud-rain', isDay: false },
  82: { code: 82, description: 'Violent rain showers', icon: 'cloud-rain', isDay: false },
  85: { code: 85, description: 'Slight snow showers', icon: 'cloud-snow', isDay: false },
  86: { code: 86, description: 'Heavy snow showers', icon: 'cloud-snow', isDay: false },
  95: { code: 95, description: 'Thunderstorm', icon: 'cloud-lightning', isDay: false },
  96: { code: 96, description: 'Thunderstorm with slight hail', icon: 'cloud-lightning', isDay: false },
  99: { code: 99, description: 'Thunderstorm with heavy hail', icon: 'cloud-lightning', isDay: false },
}

/**
 * Get weather code info for a given code and time of day
 */
export function getWeatherCodeInfo(code: number, isDay: boolean = true): WeatherCodeInfo {
  const codes = isDay ? WEATHER_CODES : NIGHT_WEATHER_CODES
  return codes[code] || { code, description: 'Unknown', icon: 'help-circle' }
}

/**
 * Get weather description for a code
 */
export function getWeatherDescription(code: number, isDay: boolean = true): string {
  return getWeatherCodeInfo(code, isDay).description
}

/**
 * Get Lucide icon name for a weather code
 */
export function getWeatherIcon(code: number, isDay: boolean = true): string {
  return getWeatherCodeInfo(code, isDay).icon
}

/**
 * Check if weather code represents precipitation
 */
export function isPrecipitation(code: number): boolean {
  const precipCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86]
  return precipCodes.includes(code)
}

/**
 * Check if weather code represents thunderstorm
 */
export function isThunderstorm(code: number): boolean {
  return [95, 96, 99].includes(code)
}

/**
 * Check if weather code represents snow
 */
export function isSnow(code: number): boolean {
  const snowCodes = [71, 73, 75, 77, 85, 86]
  return snowCodes.includes(code)
}

/**
 * Check if weather code represents fog
 */
export function isFog(code: number): boolean {
  return [45, 48].includes(code)
}

/**
 * Get precipitation intensity from code
 */
export function getPrecipitationIntensity(code: number): 'none' | 'light' | 'moderate' | 'heavy' | 'violent' {
  if (!isPrecipitation(code)) return 'none'

  // Light: 51, 56, 61, 66, 71, 80, 85
  if ([51, 56, 61, 66, 71, 80, 85].includes(code)) return 'light'
  // Moderate: 53, 63, 73, 81
  if ([53, 63, 73, 81].includes(code)) return 'moderate'
  // Heavy: 55, 57, 65, 67, 75, 82, 86
  if ([55, 57, 65, 67, 75, 82, 86].includes(code)) return 'heavy'
  // Violent: 95, 96, 99 (thunderstorm)
  if ([95, 96, 99].includes(code)) return 'violent'

  return 'light'
}