/**
 * Unit tests for unit conversion and formatting utilities
 */

import { describe, it, expect } from 'vitest'
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature,
  msToKmh,
  msToMph,
  formatWindSpeed,
  mmToInch,
  formatPrecipitation,
  formatVisibility,
  formatPressure,
  formatHumidity,
  formatWindDirection,
  getUVIndexCategory,
} from '../src/utils/units'

describe('temperature conversions', () => {
  it('converts celsius to fahrenheit', () => {
    expect(celsiusToFahrenheit(0)).toBe(32)
    expect(celsiusToFahrenheit(100)).toBe(212)
    expect(celsiusToFahrenheit(25)).toBeCloseTo(77)
  })

  it('converts fahrenheit to celsius', () => {
    expect(fahrenheitToCelsius(32)).toBe(0)
    expect(fahrenheitToCelsius(212)).toBe(100)
  })

  it('formats temperature with the correct unit suffix', () => {
    expect(formatTemperature(25, 'celsius')).toBe('25°C')
    expect(formatTemperature(25, 'fahrenheit')).toBe('77°F')
    expect(formatTemperature(25.4, 'celsius', 1)).toBe('25.4°C')
  })
})

describe('wind speed conversions', () => {
  it('converts m/s to km/h and mph', () => {
    expect(msToKmh(10)).toBeCloseTo(36)
    expect(msToMph(10)).toBeCloseTo(22.37, 1)
  })

  it('formats wind speed with the correct unit', () => {
    expect(formatWindSpeed(5, 'ms')).toBe('5.0 m/s')
    expect(formatWindSpeed(5, 'kmh')).toBe('18.0 km/h')
    expect(formatWindSpeed(5, 'mph')).toBe('11.2 mph')
  })
})

describe('precipitation formatting', () => {
  it('converts mm to inches', () => {
    expect(mmToInch(25.4)).toBeCloseTo(1)
  })

  it('formats precipitation and hides zeros', () => {
    expect(formatPrecipitation(0, 'mm')).toBe('—')
    expect(formatPrecipitation(5, 'mm')).toBe('5.0 mm')
    expect(formatPrecipitation(25.4, 'inch')).toContain('in')
  })
})

describe('other weather formats', () => {
  it('formats visibility', () => {
    expect(formatVisibility(2000)).toBe('2.0 km')
    expect(formatVisibility(500)).toBe('500 m')
    expect(formatVisibility(2000, true)).toBe('1.2 mi')
  })

  it('formats pressure in hPa or inHg', () => {
    expect(formatPressure(1013)).toBe('1013 hPa')
    expect(formatPressure(1013, true)).toContain('inHg')
  })

  it('formats humidity as a percentage', () => {
    expect(formatHumidity(63.4)).toBe('63%')
  })

  it('maps wind direction degrees to compass points', () => {
    expect(formatWindDirection(0)).toBe('N')
    expect(formatWindDirection(90)).toBe('E')
    expect(formatWindDirection(180)).toBe('S')
    expect(formatWindDirection(270)).toBe('W')
  })

  it('categorizes UV index per WHO scale', () => {
    expect(getUVIndexCategory(1).label).toBe('Low')
    expect(getUVIndexCategory(4).label).toBe('Moderate')
    expect(getUVIndexCategory(6).label).toBe('High')
    expect(getUVIndexCategory(9).label).toBe('Very High')
    expect(getUVIndexCategory(12).label).toBe('Extreme')
  })

  it('returns defined theme variables for UV category colors', () => {
    for (const value of [1, 4, 6, 9, 12]) {
      expect(getUVIndexCategory(value).color).toMatch(/^var\(--semantic-/)
    }
  })
})
