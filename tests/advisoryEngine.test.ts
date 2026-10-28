/**
 * Unit tests for the rule-based advisory engine
 */

import { describe, it, expect } from 'vitest'
import { generateAdvisories, PAGASA_URL, ADVISORY_DISCLAIMER } from '../src/services/advisoryEngine'
import type { ProcessedHourlyData, ProcessedDailyData } from '../src/types/weather'

const baseHour: ProcessedHourlyData = {
  time: new Date('2026-01-15T08:00:00'),
  temperature: 28,
  feelsLike: 30,
  humidity: 60,
  precipitationProbability: 20,
  precipitation: 0,
  weatherCode: 1,
  windSpeed: 3,
  windDirection: 90,
}

const baseDay: ProcessedDailyData = {
  date: new Date('2026-01-15T00:00:00'),
  weatherCode: 1,
  tempMax: 31,
  tempMin: 24,
  feelsLikeMax: 33,
  feelsLikeMin: 25,
  precipitationSum: 2,
  precipitationProbability: 20,
  windSpeedMax: 5,
  windDirection: 90,
}

describe('generateAdvisories', () => {
  it('returns no advisories for calm conditions', () => {
    const advisories = generateAdvisories(baseHour, [baseHour], [baseDay])
    const critical = advisories.filter(a => a.severity !== 'info')
    expect(critical).toHaveLength(0)
  })

  it('escalates to danger for extreme heat', () => {
    const hot: ProcessedHourlyData = { ...baseHour, temperature: 41, feelsLike: 44 }
    const advisories = generateAdvisories(hot, [hot], [baseDay])
    expect(advisories.some(a => a.severity === 'danger' && a.category === 'Heat')).toBe(true)
  })

  it('escalates wind severity with speed (20 m/s = gale danger)', () => {
    const windy: ProcessedHourlyData = { ...baseHour, windSpeed: 20 } // 72 km/h
    const advisories = generateAdvisories(windy, [windy], [baseDay])
    expect(advisories.some(a => a.severity === 'danger' && a.category === 'Wind')).toBe(true)
  })

  it('flags thunderstorm preparedness from the daily forecast', () => {
    const stormyDay: ProcessedDailyData = { ...baseDay, weatherCode: 95 }
    const advisories = generateAdvisories(null, [], [stormyDay])
    expect(advisories.some(a => a.title.includes('Thunderstorm'))).toBe(true)
  })

  it('sorts danger before warning before info', () => {
    const hot: ProcessedHourlyData = { ...baseHour, temperature: 41, feelsLike: 44 }
    const hotDay: ProcessedDailyData = { ...baseDay, tempMax: 37, feelsLikeMax: 39 }
    const advisories = generateAdvisories(hot, [hot], [hotDay])
    const severities = advisories.map(a => a.severity)
    const order = { danger: 0, warning: 1, info: 2 } as const
    const ranks = severities.map(s => order[s])
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks)
  })

  it('exposes the PAGASA reference and disclaimer', () => {
    expect(PAGASA_URL).toContain('pagasa.dost.gov.ph')
    expect(ADVISORY_DISCLAIMER).toContain('not official weather warnings')
  })
})
