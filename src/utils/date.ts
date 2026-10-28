/**
 * Date and time formatting utilities
 * Handles timezone-aware date formatting for weather data
 */

type FormatOptions = {
  timeZone?: string
  locale?: string | string[]
}

/**
 * Create Intl.DateTimeFormat with timezone support
 */
function createDateTimeFormat(
  options: Intl.DateTimeFormatOptions = {},
  { timeZone, locale }: FormatOptions = {}
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone })
}

/**
 * Get date components (year, month, day, hour, minute) in a specific timezone
 */
function getDateComponentsInTimezone(date: Date, timeZone: string): {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10)
  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  }
}

/**
 * Get timezone offset in minutes for a specific date in a timezone
 * Positive = ahead of UTC (e.g., +480 for UTC+8)
 */
function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  // Get local time components in the target timezone
  const localFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const localParts = localFormatter.formatToParts(date)
  const getPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parseInt(parts.find(p => p.type === type)?.value || '0', 10)

  // Get UTC time components
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const utcParts = utcFormatter.formatToParts(date)

  // Calculate offset = local time - UTC time (in minutes)
  // Need to handle day boundary: if local day != UTC day, adjust
  const localYear = getPart(localParts, 'year')
  const localMonth = getPart(localParts, 'month')
  const localDay = getPart(localParts, 'day')
  const localHour = getPart(localParts, 'hour')
  const localMinute = getPart(localParts, 'minute')

  const utcYear = getPart(utcParts, 'year')
  const utcMonth = getPart(utcParts, 'month')
  const utcDay = getPart(utcParts, 'day')
  const utcHour = getPart(utcParts, 'hour')
  const utcMinute = getPart(utcParts, 'minute')

  // Compute difference in minutes
  // Convert both to minutes since epoch for comparison
  // We can use Date.UTC for both
  const localMs = Date.UTC(localYear, localMonth - 1, localDay, localHour, localMinute, 0)
  const utcMs = Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute, 0)

  return Math.round((localMs - utcMs) / 60000)
}

/**
 * Format a date to a readable string in the given timezone
 */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}, formatOptions: FormatOptions = {}): string {
  return createDateTimeFormat({
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  }, formatOptions).format(date)
}

/**
 * Format time (HH:MM) in 12-hour or 24-hour format
 */
export function formatTime(date: Date, use24Hour: boolean = false, formatOptions: FormatOptions = {}): string {
  return createDateTimeFormat({
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  }, formatOptions).format(date)
}

/**
 * Format date as "Today", "Tomorrow", or day name
 */
export function formatRelativeDay(date: Date, referenceDate: Date = new Date(), formatOptions: FormatOptions = {}): string {
  // Calculate diff in the target timezone if provided
  let diffDays: number
  if (formatOptions.timeZone) {
    const refComponents = getDateComponentsInTimezone(referenceDate, formatOptions.timeZone)
    const dateComponents = getDateComponentsInTimezone(date, formatOptions.timeZone)
    // Create dates at midnight in the target timezone for comparison
    const refMidnight = Date.UTC(refComponents.year, refComponents.month - 1, refComponents.day)
    const dateMidnight = Date.UTC(dateComponents.year, dateComponents.month - 1, dateComponents.day)
    diffDays = Math.floor((dateMidnight - refMidnight) / (1000 * 60 * 60 * 24))
  } else {
    const refTime = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime()
    const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    diffDays = Math.floor((dateTime - refTime) / (1000 * 60 * 60 * 24))
  }

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays < 7) {
    return createDateTimeFormat({ weekday: 'long' }, formatOptions).format(date)
  }
  return formatDate(date, {}, formatOptions)
}

/**
 * Format full date for display (e.g., "Monday, January 15")
 */
export function formatFullDate(date: Date, formatOptions: FormatOptions = {}): string {
  return createDateTimeFormat({
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }, formatOptions).format(date)
}

/**
 * Format short date for charts (e.g., "Mon 1/15")
 */
export function formatChartDate(date: Date, formatOptions: FormatOptions = {}): string {
  return createDateTimeFormat({
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }, formatOptions).format(date)
}

/**
 * Format hour for hourly chart (e.g., "3 PM" or "15:00")
 */
export function formatChartHour(date: Date, use24Hour: boolean = false, formatOptions: FormatOptions = {}): string {
  return createDateTimeFormat({
    hour: 'numeric',
    hour12: !use24Hour,
  }, formatOptions).format(date)
}

/**
 * Parse ISO date string from API in the given timezone
 * Open-Meteo returns dates in local timezone without offset (e.g., "2026-01-15")
 * Returns a Date representing that local midnight in UTC
 */
export function parseAPIDate(dateString: string, timeZone?: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  if (timeZone) {
    // We want to create a Date representing midnight in the target timezone
    // Strategy: Create the date at noon UTC, find the offset, then calculate midnight
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    const offsetMinutes = getTimezoneOffsetMinutes(noonUtc, timeZone)
    // Local midnight = UTC midnight + offset
    // UTC midnight for the target date = Date.UTC(year, month - 1, day)
    // But we need to be careful: the offset at noon might differ from offset at midnight (DST)
    // Use the offset at the local midnight instead
    const localMidnightUtc = Date.UTC(year, month - 1, day) - offsetMinutes * 60 * 1000
    // Verify by checking the offset at the calculated local midnight
    const verifyDate = new Date(localMidnightUtc)
    const verifyOffset = getTimezoneOffsetMinutes(verifyDate, timeZone)
    // If offset changed (DST boundary), adjust
    if (verifyOffset !== offsetMinutes) {
      return new Date(Date.UTC(year, month - 1, day) - verifyOffset * 60 * 1000)
    }
    return new Date(localMidnightUtc)
  }
  return new Date(year, month - 1, day)
}

/**
 * Parse API time string (format: "YYYY-MM-DDTHH:00") in the given timezone
 * Open-Meteo returns times in local timezone without offset
 * Returns a Date representing that local time in UTC
 */
export function parseAPITime(timeString: string, timeZone?: string): Date {
  const [datePart, timePart] = timeString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  if (timeZone) {
    // Strategy: Create the date at the given local time in the target timezone
    // We'll use noon UTC as reference to find the offset
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    const offsetMinutes = getTimezoneOffsetMinutes(noonUtc, timeZone)
    // Local time = UTC time + offset
    // So UTC time = Local time - offset
    const localTimeUtc = Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60 * 1000
    // Verify offset at the calculated time
    const verifyDate = new Date(localTimeUtc)
    const verifyOffset = getTimezoneOffsetMinutes(verifyDate, timeZone)
    if (verifyOffset !== offsetMinutes) {
      return new Date(Date.UTC(year, month - 1, day, hour, minute) - verifyOffset * 60 * 1000)
    }
    return new Date(localTimeUtc)
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute))
}

/**
 * Get current date in local timezone at midnight
 */
export function getTodayMidnight(timeZone?: string): Date {
  const now = new Date()
  if (timeZone) {
    const components = getDateComponentsInTimezone(now, timeZone)
    // Use parseAPIDate logic to correctly compute midnight in the target timezone
    const dateStr = `${components.year}-${String(components.month).padStart(2, '0')}-${String(components.day).padStart(2, '0')}`
    return parseAPIDate(dateStr, timeZone)
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Check if date is today
 */
export function isToday(date: Date, timeZone?: string): boolean {
  if (timeZone) {
    const todayComponents = getDateComponentsInTimezone(new Date(), timeZone)
    const dateComponents = getDateComponentsInTimezone(date, timeZone)
    return dateComponents.year === todayComponents.year &&
           dateComponents.month === todayComponents.month &&
           dateComponents.day === todayComponents.day
  }
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date, timeZone?: string): boolean {
  if (timeZone) {
    const todayComponents = getDateComponentsInTimezone(new Date(), timeZone)
    const tomorrowDate = new Date(Date.UTC(todayComponents.year, todayComponents.month - 1, todayComponents.day))
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1)
    const tomorrowComponents = getDateComponentsInTimezone(tomorrowDate, timeZone)
    const dateComponents = getDateComponentsInTimezone(date, timeZone)
    return dateComponents.year === tomorrowComponents.year &&
           dateComponents.month === tomorrowComponents.month &&
           dateComponents.day === tomorrowComponents.day
  }
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.getDate() === tomorrow.getDate() &&
         date.getMonth() === tomorrow.getMonth() &&
         date.getFullYear() === tomorrow.getFullYear()
}

/**
 * Get array of dates for next N days starting from today
 */
export function getNextNDays(n: number, timeZone?: string): Date[] {
  const dates: Date[] = []
  const today = getTodayMidnight(timeZone)
  for (let i = 0; i < n; i++) {
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() + i)
    dates.push(date)
  }
  return dates
}

/**
 * Format date for API request (YYYY-MM-DD)
 */
export function formatAPIDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Format datetime for API request (YYYY-MM-DDTHH:00)
 */
export function formatAPIDateTime(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:00`
}

/**
 * Get timezone offset string for display (e.g., "UTC+8")
 */
export function getTimezoneDisplay(timezone: string): string {
  try {
    // Use a fixed date to get the offset for the timezone
    const date = new Date('2026-01-15T12:00:00Z')
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(date)
    const tzPart = parts.find(p => p.type === 'timeZoneName')
    let offsetStr = ''
    if (tzPart) {
      const match = tzPart.value.match(/([+-])(\d{1,2}):?(\d{2})?/)
      if (match) {
        const sign = match[1]
        const hours = match[2].padStart(2, '0')
        const minutes = (match[3] || '00').padStart(2, '0')
        offsetStr = `UTC${sign}${hours}:${minutes}`
      }
    }
    return offsetStr ? `${offsetStr} (${timezone})` : timezone
  } catch {
    return timezone
  }
}

/**
 * Get current time as a Date object (always UTC internally)
 * The returned Date represents the current instant. Use getDateComponentsInTimezone
 * to extract local time components for a specific timezone.
 */
export function getCurrentTimeInTimezone(_timezone: string): Date {
  // Simply return the current instant. The Date object is always in UTC internally.
  // Callers should use getDateComponentsInTimezone() to get local time components.
  return new Date()
}

/**
 * Check if time is daytime (6 AM - 6 PM) in the given timezone
 */
export function isDaytime(date: Date, timeZone?: string): boolean {
  if (timeZone) {
    const { hour } = getDateComponentsInTimezone(date, timeZone)
    return hour >= 6 && hour < 18
  }
  const hours = date.getHours()
  return hours >= 6 && hours < 18
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} hr`
  return `${hours} hr ${mins} min`
}