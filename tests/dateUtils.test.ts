/**
 * Unit tests for timezone-aware date formatting utilities
 * Tests different timezones, date boundaries, and daylight transitions
 */

import { describe, it, expect, vi } from 'vitest'
import {
  formatDate,
  formatTime,
  formatRelativeDay,
  formatChartDate,
  formatChartHour,
  parseAPIDate,
  parseAPITime,
  getTodayMidnight,
  isToday,
  isTomorrow,
  getNextNDays,
  formatAPIDate,
  formatAPIDateTime,
  getTimezoneDisplay,
  getCurrentTimeInTimezone,
  isDaytime,
  formatDuration,
} from '../src/utils/date'

// Mock time for consistent testing
const MOCK_BASE_TIME = new Date('2026-01-15T12:00:00Z') // Jan 15, 2026 12:00 UTC

describe('date utilities - timezone handling', () => {
  // Use vi.useFakeTimers to control time
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_BASE_TIME)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatTime', () => {
    it('formats time in 24-hour format with timezone', () => {
      const date = new Date('2026-01-15T08:30:00+08:00') // 08:30 in Asia/Manila
      const result = formatTime(date, true, { timeZone: 'Asia/Manila' })
      // Should show 08:30 in Manila time
      expect(result).toMatch(/08:30/)
    })

    it('formats time in 12-hour format with timezone', () => {
      const date = new Date('2026-01-15T08:30:00+08:00')
      const result = formatTime(date, false, { timeZone: 'Asia/Manila' })
      expect(result).toMatch(/8:30 AM/)
    })

    it('handles timezone conversion correctly', () => {
      // 12:00 UTC = 20:00 Asia/Manila (UTC+8)
      const date = new Date('2026-01-15T12:00:00Z')
      const result = formatTime(date, true, { timeZone: 'Asia/Manila' })
      expect(result).toMatch(/20:00/)
    })

    it('handles negative timezone offset', () => {
      // 12:00 UTC = 07:00 America/New_York (UTC-5 in winter)
      const date = new Date('2026-01-15T12:00:00Z')
      const result = formatTime(date, true, { timeZone: 'America/New_York' })
      expect(result).toMatch(/07:00/)
    })
  })

  describe('formatChartHour', () => {
    it('formats hour in 24-hour format with timezone', () => {
      const date = new Date('2026-01-15T08:00:00+08:00')
      const result = formatChartHour(date, true, { timeZone: 'Asia/Manila' })
      expect(result).toMatch(/8/)
    })

    it('formats hour in 12-hour format with timezone', () => {
      const date = new Date('2026-01-15T14:00:00+08:00')
      const result = formatChartHour(date, false, { timeZone: 'Asia/Manila' })
      expect(result).toMatch(/2 PM/)
    })
  })

  describe('formatChartDate', () => {
    it('formats date with timezone', () => {
      const date = new Date('2026-01-15T12:00:00Z')
      const result = formatChartDate(date, { timeZone: 'Asia/Manila' })
      // Should show Jan 15 in Manila time
      expect(result).toMatch(/Jan 15/)
    })

    it('handles date boundary across midnight in different timezone', () => {
      // 23:00 UTC on Jan 14 = 07:00 Jan 15 in Asia/Manila
      const date = new Date('2026-01-14T23:00:00Z')
      const result = formatChartDate(date, { timeZone: 'Asia/Manila' })
      expect(result).toMatch(/Jan 15/)
    })
  })

  describe('formatRelativeDay', () => {
    it('returns "Today" for same day in timezone', () => {
      const date = new Date('2026-01-15T12:00:00Z') // Today in UTC
      const result = formatRelativeDay(date, MOCK_BASE_TIME, { timeZone: 'UTC' })
      expect(result).toBe('Today')
    })

    it('returns "Tomorrow" for next day in timezone', () => {
      const tomorrow = new Date('2026-01-16T00:00:00Z')
      const result = formatRelativeDay(tomorrow, MOCK_BASE_TIME, { timeZone: 'UTC' })
      expect(result).toBe('Tomorrow')
    })

    it('returns "Yesterday" for previous day in timezone', () => {
      const yesterday = new Date('2026-01-14T00:00:00Z')
      const result = formatRelativeDay(yesterday, MOCK_BASE_TIME, { timeZone: 'UTC' })
      expect(result).toBe('Yesterday')
    })

    it('handles timezone date boundary correctly', () => {
      // 20:00 UTC on Jan 15 = 04:00 Jan 16 in Asia/Manila (next day)
      const date = new Date('2026-01-16T04:00:00+08:00')
      const reference = new Date('2026-01-15T20:00:00+08:00') // Same day in Manila
      const result = formatRelativeDay(date, reference, { timeZone: 'Asia/Manila' })
      expect(result).toBe('Tomorrow')
    })

    it('shows weekday name for days 2-6 away', () => {
      const date = new Date('2026-01-18T00:00:00Z') // 3 days later
      const result = formatRelativeDay(date, MOCK_BASE_TIME, { timeZone: 'UTC' })
      expect(result).toBe('Sunday')
    })
  })

  describe('parseAPIDate', () => {
    it('parses YYYY-MM-DD in specified timezone', () => {
      const date = parseAPIDate('2026-01-15', 'Asia/Manila')
      // Should be midnight in Manila
      expect(date.getHours()).toBe(0)
      expect(date.getMinutes()).toBe(0)
    })

    it('handles UTC when no timezone provided', () => {
      const date = parseAPIDate('2026-01-15')
      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(0) // January
      expect(date.getDate()).toBe(15)
    })

    it('handles date boundary correctly across timezones', () => {
      // Parse as midnight in Manila, should be 16:00 UTC previous day
      const date = parseAPIDate('2026-01-15', 'Asia/Manila')
      const utcDate = new Date(date.toISOString())
      expect(utcDate.getUTCHours()).toBe(16) // 00:00 Manila = 16:00 UTC previous day
      expect(utcDate.getUTCDate()).toBe(14)
    })
  })

  describe('parseAPITime', () => {
    it('parses YYYY-MM-DDTHH:00 in specified timezone', () => {
      const date = parseAPITime('2026-01-15T08:00', 'Asia/Manila')
      // Should be 08:00 in Manila
      expect(date.getHours()).toBe(8)
      expect(date.getMinutes()).toBe(0)
    })

    it('handles UTC when no timezone provided', () => {
      const date = parseAPITime('2026-01-15T08:00')
      expect(date.getUTCHours()).toBe(8)
    })

    it('handles timezone conversion correctly', () => {
      // 08:00 in Manila = 00:00 UTC
      const date = parseAPITime('2026-01-15T08:00', 'Asia/Manila')
      expect(date.getUTCHours()).toBe(0)
    })
  })

  describe('getTodayMidnight', () => {
    it('returns midnight in specified timezone', () => {
      const midnight = getTodayMidnight('Asia/Manila')
      // Mock time is 2026-01-15T12:00:00Z = 20:00 Jan 15 in Manila (UTC+8)
      // "Today" in Manila is Jan 15
      // Midnight of Jan 15 in Manila = 2026-01-14T16:00:00Z
      expect(midnight.getUTCHours()).toBe(16)
      expect(midnight.getUTCDate()).toBe(14)
      expect(midnight.getUTCMonth()).toBe(0) // January
      expect(midnight.getUTCFullYear()).toBe(2026)
    })

    it('returns system midnight when no timezone', () => {
      const midnight = getTodayMidnight()
      expect(midnight.getHours()).toBe(0)
      expect(midnight.getMinutes()).toBe(0)
    })
  })

  describe('isToday', () => {
    it('returns true for today in timezone', () => {
      const today = new Date('2026-01-15T12:00:00Z')
      expect(isToday(today, 'UTC')).toBe(true)
    })

    it('handles date boundary correctly', () => {
      // Mock time is 2026-01-15T12:00:00Z = 20:00 Jan 15 in Manila (UTC+8)
      // Date is 2026-01-16T04:00:00+08:00 = 04:00 Jan 16 in Manila = 20:00 Jan 15 UTC
      // In Manila, "now" is Jan 15, date is Jan 16 → NOT today
      const date = new Date('2026-01-16T04:00:00+08:00')
      expect(isToday(date, 'Asia/Manila')).toBe(false)
    })
  })

  describe('isTomorrow', () => {
    it('returns true for tomorrow in timezone', () => {
      const tomorrow = new Date('2026-01-16T00:00:00Z')
      expect(isTomorrow(tomorrow, 'UTC')).toBe(true)
    })

    it('handles timezone boundary', () => {
      // Mock time is 2026-01-15T12:00:00Z = 20:00 Jan 15 in Manila (UTC+8)
      // Date is 2026-01-16T04:00:00+08:00 = 04:00 Jan 16 in Manila
      // In Manila, "now" is Jan 15, date is Jan 16 → IS tomorrow
      const date = new Date('2026-01-16T04:00:00+08:00')
      expect(isTomorrow(date, 'Asia/Manila')).toBe(true)
    })
  })

  describe('getNextNDays', () => {
    it('returns N dates starting from today in timezone', () => {
      const dates = getNextNDays(3, 'UTC')
      expect(dates).toHaveLength(3)
      expect(dates[0].getUTCDate()).toBe(15) // Jan 15
      expect(dates[1].getUTCDate()).toBe(16) // Jan 16
      expect(dates[2].getUTCDate()).toBe(17) // Jan 17
    })

    it('handles timezone correctly', () => {
      // Mock time is 2026-01-15T12:00:00Z = 20:00 Jan 15 in Manila
      // "Today" in Manila is Jan 15
      // Midnight of Jan 15 in Manila = 2026-01-14T16:00:00Z
      const dates = getNextNDays(3, 'Asia/Manila')
      expect(dates).toHaveLength(3)
      // All should be at midnight in Manila (16:00 UTC previous day)
      expect(dates[0].getUTCHours()).toBe(16)
      expect(dates[0].getUTCDate()).toBe(14) // Jan 14 UTC = Jan 15 Manila
      expect(dates[1].getUTCHours()).toBe(16)
      expect(dates[1].getUTCDate()).toBe(15) // Jan 15 UTC = Jan 16 Manila
      expect(dates[2].getUTCHours()).toBe(16)
      expect(dates[2].getUTCDate()).toBe(16) // Jan 16 UTC = Jan 17 Manila
    })
  })

  describe('isDaytime', () => {
    it('returns true for daytime hours (6-18) in timezone', () => {
      const noon = new Date('2026-01-15T12:00:00+08:00') // Noon in Manila
      expect(isDaytime(noon, 'Asia/Manila')).toBe(true)
    })

    it('returns false for nighttime hours in timezone', () => {
      const midnight = new Date('2026-01-15T00:00:00+08:00') // Midnight in Manila
      expect(isDaytime(midnight, 'Asia/Manila')).toBe(false)
    })

    it('handles 6 AM boundary', () => {
      const dawn = new Date('2026-01-15T06:00:00+08:00')
      expect(isDaytime(dawn, 'Asia/Manila')).toBe(true)
    })

    it('handles 6 PM boundary', () => {
      const dusk = new Date('2026-01-15T18:00:00+08:00')
      expect(isDaytime(dusk, 'Asia/Manila')).toBe(false)
    })

    it('uses system timezone when not specified', () => {
      const noon = new Date()
      noon.setHours(12, 0, 0, 0)
      expect(isDaytime(noon)).toBe(true)
    })
  })

  describe('formatDuration', () => {
    it('formats minutes', () => {
      expect(formatDuration(30)).toBe('30 min')
      expect(formatDuration(59)).toBe('59 min')
    })

    it('formats hours', () => {
      expect(formatDuration(60)).toBe('1 hr')
      expect(formatDuration(120)).toBe('2 hr')
    })

    it('formats hours and minutes', () => {
      expect(formatDuration(90)).toBe('1 hr 30 min')
      expect(formatDuration(125)).toBe('2 hr 5 min')
    })
  })

  describe('formatAPIDate', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date('2026-01-15T12:00:00Z')
      expect(formatAPIDate(date)).toBe('2026-01-15')
    })

    it('handles month padding', () => {
      const date = new Date('2026-09-05T12:00:00Z')
      expect(formatAPIDate(date)).toBe('2026-09-05')
    })
  })

  describe('formatAPIDateTime', () => {
    it('formats datetime as YYYY-MM-DDTHH:00', () => {
      const date = new Date('2026-01-15T08:30:00Z')
      expect(formatAPIDateTime(date)).toBe('2026-01-15T08:00')
    })
  })

  describe('getTimezoneDisplay', () => {
    it('returns timezone display string', () => {
      const result = getTimezoneDisplay('Asia/Manila')
      expect(result).toContain('UTC+')
      expect(result).toContain('Manila')
    })

    it('handles unknown timezone gracefully', () => {
      const result = getTimezoneDisplay('Invalid/Timezone')
      // Should fall back to the timezone string
      expect(result).toBe('Invalid/Timezone')
    })
  })

  describe('getCurrentTimeInTimezone', () => {
    it('returns current time in specified timezone', () => {
      const time = getCurrentTimeInTimezone('Asia/Manila')
      expect(time).toBeInstanceOf(Date)
      expect(time.getTime()).not.toBeNaN()
    })

    it('falls back to system time on error', () => {
      const time = getCurrentTimeInTimezone('Invalid/Timezone')
      expect(time).toBeInstanceOf(Date)
      expect(time.getTime()).not.toBeNaN()
    })
  })
})

describe('date utilities - edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_BASE_TIME)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles DST transition in US timezones', () => {
    // Test that formatting works across DST boundaries
    // In March 2026, DST starts in US on March 8
    const beforeDST = new Date('2026-03-07T12:00:00Z')
    const afterDST = new Date('2026-03-09T12:00:00Z')

    const beforeResult = formatTime(beforeDST, true, { timeZone: 'America/New_York' })
    const afterResult = formatTime(afterDST, true, { timeZone: 'America/New_York' })

    // Before DST: 12:00 UTC = 07:00 EST (UTC-5)
    // After DST: 12:00 UTC = 08:00 EDT (UTC-4)
    expect(beforeResult).toContain('07:00')
    expect(afterResult).toContain('08:00')
  })

  it('handles leap year correctly', () => {
    const leapDay = new Date('2024-02-29T12:00:00Z')
    const result = formatDate(leapDay, {}, { timeZone: 'UTC' })
    expect(result).toContain('Feb 29')
  })

  it('handles year boundary', () => {
    const newYearEve = new Date('2025-12-31T23:00:00Z')
    const newYear = new Date('2026-01-01T01:00:00Z')

    const eveResult = formatChartDate(newYearEve, { timeZone: 'UTC' })
    const newYearResult = formatChartDate(newYear, { timeZone: 'UTC' })

    expect(eveResult).toContain('Dec 31')
    expect(newYearResult).toContain('Jan 1')
  })

  it('handles midnight correctly in different timezones', () => {
    // Midnight UTC
    const midnightUTC = new Date('2026-01-15T00:00:00Z')
    const resultUTC = formatTime(midnightUTC, true, { timeZone: 'UTC' })
    expect(resultUTC).toMatch(/00:00/)

    // Midnight in Manila (16:00 UTC previous day)
    const midnightManila = new Date('2026-01-14T16:00:00Z')
    const resultManila = formatTime(midnightManila, true, { timeZone: 'Asia/Manila' })
    expect(resultManila).toMatch(/00:00/)
  })
})