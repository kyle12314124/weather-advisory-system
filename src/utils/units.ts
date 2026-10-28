/**
 * Unit conversion utilities
 * All API values are in metric (Celsius, m/s, mm)
 * Display values are converted based on user preferences
 */

import type { TemperatureUnit, WindSpeedUnit, PrecipitationUnit } from '../types/settings'

// Temperature conversions
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9 / 5) + 32
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5 / 9
}

export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  if (from === to) return value
  if (from === 'celsius' && to === 'fahrenheit') return celsiusToFahrenheit(value)
  if (from === 'fahrenheit' && to === 'celsius') return fahrenheitToCelsius(value)
  return value
}

export function formatTemperature(value: number, unit: TemperatureUnit, decimals: number = 0): string {
  const converted = unit === 'fahrenheit' ? celsiusToFahrenheit(value) : value
  const suffix = unit === 'fahrenheit' ? '°F' : '°C'
  return `${converted.toFixed(decimals)}${suffix}`
}

// Wind speed conversions (API returns m/s)
export function msToKmh(ms: number): number {
  return ms * 3.6
}

export function msToMph(ms: number): number {
  return ms * 2.23694
}

export function kmhToMs(kmh: number): number {
  return kmh / 3.6
}

export function mphToMs(mph: number): number {
  return mph / 2.23694
}

export function convertWindSpeed(value: number, from: WindSpeedUnit, to: WindSpeedUnit): number {
  if (from === to) return value

  // Convert to m/s first
  let msValue: number
  switch (from) {
    case 'ms':
      msValue = value
      break
    case 'kmh':
      msValue = kmhToMs(value)
      break
    case 'mph':
      msValue = mphToMs(value)
      break
    default:
      return value
  }

  // Convert from m/s to target
  switch (to) {
    case 'ms':
      return msValue
    case 'kmh':
      return msToKmh(msValue)
    case 'mph':
      return msToMph(msValue)
    default:
      return value
  }
}

export function formatWindSpeed(value: number, unit: WindSpeedUnit, decimals: number = 1): string {
  const converted = convertWindSpeed(value, 'ms', unit)
  const suffix = unit === 'ms' ? 'm/s' : unit === 'kmh' ? 'km/h' : 'mph'
  return `${converted.toFixed(decimals)} ${suffix}`
}

export function getWindSpeedUnitLabel(unit: WindSpeedUnit): string {
  switch (unit) {
    case 'ms': return 'm/s'
    case 'kmh': return 'km/h'
    case 'mph': return 'mph'
  }
}

// Precipitation conversions (API returns mm)
export function mmToInch(mm: number): number {
  return mm / 25.4
}

export function inchToMm(inch: number): number {
  return inch * 25.4
}

export function convertPrecipitation(value: number, from: PrecipitationUnit, to: PrecipitationUnit): number {
  if (from === to) return value
  if (from === 'mm' && to === 'inch') return mmToInch(value)
  if (from === 'inch' && to === 'mm') return inchToMm(value)
  return value
}

export function formatPrecipitation(value: number, unit: PrecipitationUnit, decimals: number = 1): string {
  const converted = unit === 'inch' ? mmToInch(value) : value
  const suffix = unit === 'inch' ? 'in' : 'mm'
  // Show as "—" for zero precipitation
  if (converted === 0) return '—'
  return `${converted.toFixed(decimals)} ${suffix}`
}

// UV Index formatting (no conversion needed, just formatting)
export function formatUVIndex(value: number | undefined): string {
  if (value === undefined || value === null) return '—'
  return value.toFixed(0)
}

export function getUVIndexCategory(value: number): { label: string; color: string } {
  if (value <= 2) return { label: 'Low', color: 'var(--semantic-success)' }
  if (value <= 5) return { label: 'Moderate', color: 'var(--semantic-warning)' }
  if (value <= 7) return { label: 'High', color: 'var(--semantic-warning-strong)' }
  if (value <= 10) return { label: 'Very High', color: 'var(--semantic-danger)' }
  return { label: 'Extreme', color: 'var(--semantic-danger-strong)' }
}

// Visibility conversions (API returns meters)
export function metersToKm(meters: number): number {
  return meters / 1000
}

export function metersToMiles(meters: number): number {
  return meters / 1609.34
}

export function formatVisibility(meters: number, useImperial: boolean = false): string {
  if (useImperial) {
    const miles = metersToMiles(meters)
    if (miles >= 1) return `${miles.toFixed(1)} mi`
    const feet = meters * 3.28084
    return `${feet.toFixed(0)} ft`
  } else {
    const km = metersToKm(meters)
    if (km >= 1) return `${km.toFixed(1)} km`
    return `${meters.toFixed(0)} m`
  }
}

// Pressure conversion (API returns hPa = mbar)
export function hPaToInHg(hpa: number): number {
  return hpa * 0.02953
}

export function formatPressure(hpa: number, useImperial: boolean = false): string {
  if (useImperial) {
    return `${hPaToInHg(hpa).toFixed(2)} inHg`
  }
  return `${hpa.toFixed(0)} hPa`
}

// Humidity is percentage, no conversion needed
export function formatHumidity(value: number): string {
  return `${Math.round(value)}%`
}

// Wind direction
export function formatWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

export function getWindDirectionArrow(degrees: number): string {
  return `rotate(${degrees}deg)`
}