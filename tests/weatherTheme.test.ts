/**
 * Unit tests for the weather visual theme mapping
 */

import { describe, it, expect } from 'vitest'
import { getWeatherVisual, getUVScaleColor } from '../src/services/weatherTheme'

describe('getWeatherVisual', () => {
  it('maps clear codes to sun/moon depending on time of day', () => {
    expect(getWeatherVisual(0, true).icon).toBe('Sun')
    expect(getWeatherVisual(0, false).icon).toBe('Moon')
  })

  it('maps partly cloudy codes per day/night', () => {
    expect(getWeatherVisual(2, true).icon).toBe('CloudSun')
    expect(getWeatherVisual(2, false).icon).toBe('CloudMoon')
  })

  it('maps rain, thunderstorm, snow, and fog codes', () => {
    expect(getWeatherVisual(65, true).icon).toBe('CloudRain')
    expect(getWeatherVisual(95, true).icon).toBe('CloudLightning')
    expect(getWeatherVisual(73, true).icon).toBe('CloudSnow')
    expect(getWeatherVisual(45, true).icon).toBe('CloudFog')
  })

  it('falls back to the unknown style for unrecognized codes', () => {
    const visual = getWeatherVisual(9999, true)
    expect(visual.icon).toBe('HelpCircle')
  })

  it('provides static icon classes for every visual (Tailwind-safe)', () => {
    for (const code of [0, 1, 2, 3, 45, 51, 61, 71, 95, 9999]) {
      const visual = getWeatherVisual(code, true)
      expect(visual.iconClass).toMatch(/^text-[a-z]+-\d+ dark:text-/)
      expect(visual.tileClass).toContain('/')
      expect(typeof visual.icon).toBe('string')
    }
  })
})

describe('getUVScaleColor', () => {
  it('returns a gradient for every UV category', () => {
    for (const label of ['Low', 'Moderate', 'High', 'Very High', 'Extreme']) {
      expect(getUVScaleColor(label)).toMatch(/^linear-gradient/)
    }
  })

  it('uses defined semantic theme variables (not undefined --color-* tokens)', () => {
    for (const label of ['Low', 'Moderate', 'High', 'Very High', 'Extreme', 'Unknown']) {
      const gradient = getUVScaleColor(label)
      expect(gradient).not.toContain('--color-')
      expect(gradient).toContain('var(--semantic-')
    }
  })
})
