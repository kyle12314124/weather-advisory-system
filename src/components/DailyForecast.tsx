/**
 * Daily Forecast Component (7-day) - Premium Redesign
 * Beautiful cards with temperature range bars scaled to the week's min/max.
 * Fully responsive with touch-friendly interactions.
 */

import { type FC } from 'react'
import { Icon } from './Icon'
import { formatTemperature, formatWindSpeed } from '../utils/units'
import { formatRelativeDay, formatChartDate, formatTime, isDaytime, getTodayMidnight } from '../utils/date'
import { getWeatherCodeInfo } from '../services/weatherCodes'
import { getWeatherVisual } from '../services/weatherTheme'
import type { ProcessedDailyData } from '../types/weather'
import type { TemperatureUnit, WindSpeedUnit } from '../types/settings'

interface DailyForecastProps {
  daily: ProcessedDailyData[]
  temperatureUnit: TemperatureUnit
  windSpeedUnit: WindSpeedUnit
  use24Hour: boolean
  timezone: string
}

export const DailyForecast: FC<DailyForecastProps> = ({
  daily,
  temperatureUnit,
  windSpeedUnit,
  use24Hour,
  timezone,
}) => {
  if (!daily.length) return null

  const week = daily.slice(0, 7)

  // Scale range bars against the week's overall min/max so bars are comparable
  const weekMin = Math.min(...week.map(d => d.tempMin))
  const weekMax = Math.max(...week.map(d => d.tempMax))
  const span = Math.max(weekMax - weekMin, 1)

  return (
    <section aria-label="7-day forecast" className="animate-fade-in delay-3">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">7-Day Forecast</h2>
        <p className="text-sm text-text-tertiary">{week.length} day{week.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3" role="list" aria-label="Daily forecast items">
        {week.map((day, index) => (
          <DailyItem
            key={day.date.toISOString()}
            day={day}
            index={index}
            totalDays={week.length}
            weekMin={weekMin}
            span={span}
            temperatureUnit={temperatureUnit}
            windSpeedUnit={windSpeedUnit}
            use24Hour={use24Hour}
            timezone={timezone}
          />
        ))}
      </div>
    </section>
  )
}

interface DailyItemProps {
  day: ProcessedDailyData
  index: number
  totalDays: number
  weekMin: number
  span: number
  temperatureUnit: TemperatureUnit
  windSpeedUnit: WindSpeedUnit
  use24Hour: boolean
  timezone: string
}

const DailyItem: FC<DailyItemProps> = ({
  day,
  index,
  totalDays,
  weekMin,
  span,
  temperatureUnit,
  windSpeedUnit,
  use24Hour,
  timezone,
}) => {
  const formatOpts = { timeZone: timezone }
  // Use noon (12:00) for the daily date to determine day/night for icons
  const dayAtNoon = new Date(day.date)
  dayAtNoon.setHours(12, 0, 0, 0)
  const isDay = isDaytime(dayAtNoon, timezone)
  const visual = getWeatherVisual(day.weatherCode, isDay)
  const codeInfo = getWeatherCodeInfo(day.weatherCode, isDay)

  const tempMax = formatTemperature(day.tempMax, temperatureUnit)
  const tempMin = formatTemperature(day.tempMin, temperatureUnit)
  const wind = formatWindSpeed(day.windSpeedMax / 3.6, windSpeedUnit)
  const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : formatRelativeDay(day.date, getTodayMidnight(timezone), formatOpts)
  const dateStr = formatChartDate(day.date, formatOpts)

  // Temperature range bar position (percent of week span)
  const safeSpan = Math.max(span, 1)
  const left = Math.max(((day.tempMin - weekMin) / safeSpan) * 100, 0)
  const width = Math.max(((day.tempMax - day.tempMin) / safeSpan) * 100, 4)

  const isToday = index === 0

  return (
    <article
      className={`animate-slide-up card-interactive group relative overflow-hidden ${
        index < totalDays - 1 ? '' : ''
      }`}
      style={{ animationDelay: `${Math.min(index * 40, 280)}ms` }}
      role="listitem"
      aria-label={`${dayLabel}: ${codeInfo.description}, low ${tempMin}, high ${tempMax}`}
    >
      <div className="flex items-center gap-2.5 p-4 sm:gap-5 sm:p-5">
        {/* Day and date */}
        <div className="w-[4.5rem] shrink-0 sm:w-24 lg:w-28">
          <p className={`text-sm font-semibold ${isToday ? 'text-brand-primary' : 'text-text-primary'}`}>{dayLabel}</p>
          <p className="text-xs text-text-tertiary">{dateStr}</p>
        </div>

        {/* Condition icon */}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${visual.tileClass} sm:h-14 sm:w-14`}>
          <Icon
            icon={visual.icon}
            size={26}
            className={visual.iconClass}
            aria-hidden="true"
          />
        </div>

        {/* Description */}
        <p className="hidden w-36 shrink-0 break-words text-sm text-text-secondary lg:block lg:w-40">{codeInfo.description}</p>

        {/* Temperature range */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4">
          <span className="w-12 shrink-0 text-right text-sm tabular-nums text-text-tertiary sm:w-14 lg:w-16">{tempMin}</span>
          <div
            className="relative hidden h-3 flex-1 rounded-full bg-surface-3 sm:block"
            role="img"
            aria-label={`Temperature range from ${tempMin} to ${tempMax}`}
          >
            <div
              className="absolute h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: 'linear-gradient(90deg, var(--chart-low), var(--chart-high))',
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-text-primary sm:w-14 lg:w-16">{tempMax}</span>
        </div>

        {/* Precipitation probability */}
        <div className="hidden w-20 shrink-0 items-center justify-end gap-1.5 text-xs tabular-nums lg:flex">
          <Icon
            icon="Droplets"
            size={13}
            className={day.precipitationProbability >= 30 ? 'text-brand-secondary' : 'text-text-quaternary'}
            aria-hidden="true"
          />
          <span className={day.precipitationProbability >= 30 ? 'font-medium text-text-primary' : 'text-text-tertiary'}>
            {day.precipitationProbability}%
          </span>
        </div>

        {/* Wind */}
        <div className="hidden w-24 shrink-0 items-center justify-end gap-1.5 text-xs tabular-nums lg:flex lg:w-28">
          <Icon icon="Wind" size={13} aria-hidden="true" className="text-text-quaternary" />
          <span className="text-text-tertiary">{wind}</span>
        </div>

        {/* Sunrise / sunset */}
        {(day.sunrise || day.sunset) && (
          <div className="hidden shrink-0 items-center gap-3 text-xs tabular-nums xl:flex">
            {day.sunrise && (
              <span className="flex items-center gap-1 text-text-tertiary" title="Sunrise">
                <Icon icon="Sunrise" size={13} className="text-brand-accent" aria-hidden="true" />
                {formatTime(day.sunrise, use24Hour, formatOpts)}
              </span>
            )}
            {day.sunset && (
              <span className="flex items-center gap-1 text-text-tertiary" title="Sunset">
                <Icon icon="Sunset" size={13} className="text-brand-accent-hover" aria-hidden="true" />
                {formatTime(day.sunset, use24Hour, formatOpts)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Compact details for narrow screens. The summary is repeated below the
          main row until it fits at lg; sun times stay here until xl. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-subtle px-4 pb-4 pt-2 text-xs text-text-tertiary xl:hidden">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:hidden">
          <span className="flex items-center gap-1">
            <Icon icon={visual.icon} size={12} className={visual.iconClass} aria-hidden="true" />
            {codeInfo.description}
          </span>
          <span className={`flex items-center gap-1 ${day.precipitationProbability >= 30 ? 'text-brand-secondary' : ''}`}>
            <Icon icon="Droplets" size={11} aria-hidden="true" />
            {day.precipitationProbability}%
          </span>
          <span className="flex items-center gap-1 text-text-tertiary">
            <Icon icon="Wind" size={11} aria-hidden="true" />
            {wind}
          </span>
        </span>
        {day.sunrise && (
          <span className="flex items-center gap-1 text-text-tertiary" title="Sunrise">
            <Icon icon="Sunrise" size={11} className="text-brand-accent" aria-hidden="true" />
            {formatTime(day.sunrise, use24Hour, formatOpts)}
          </span>
        )}
        {day.sunset && (
          <span className="flex items-center gap-1 text-text-tertiary" title="Sunset">
            <Icon icon="Sunset" size={11} className="text-brand-accent-hover" aria-hidden="true" />
            {formatTime(day.sunset, use24Hour, formatOpts)}
          </span>
        )}
      </div>
    </article>
  )
}

export default DailyForecast