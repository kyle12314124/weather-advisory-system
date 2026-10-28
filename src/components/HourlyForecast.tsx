/**
 * Hourly Forecast Component - Premium Redesign
 * Horizontally scrollable strip of the next 24 hours with beautiful cards.
 * Fully responsive with touch-friendly interactions and smooth scrolling.
 */

import { type FC, useMemo, useState, useRef, useEffect, useLayoutEffect, useId, useCallback } from 'react'
import { Icon } from './Icon'
import { formatTemperature, formatWindSpeed } from '../utils/units'
import { formatChartHour, isDaytime } from '../utils/date'
import { getWeatherCodeInfo } from '../services/weatherCodes'
import { getWeatherVisual } from '../services/weatherTheme'
import type { ProcessedHourlyData } from '../types/weather'
import type { TemperatureUnit, WindSpeedUnit } from '../types/settings'

interface HourlyForecastProps {
  hourly: ProcessedHourlyData[]
  temperatureUnit: TemperatureUnit
  windSpeedUnit: WindSpeedUnit
  use24Hour: boolean
  timezone: string
}

export const HourlyForecast: FC<HourlyForecastProps> = ({
  hourly,
  temperatureUnit,
  windSpeedUnit,
  use24Hour,
  timezone,
}) => {
  const next24Hours = useMemo(() => hourly.slice(0, 24), [hourly])

  const scrollRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = Math.max(el.scrollWidth - el.clientWidth, 0)
    setCanScrollLeft(el.scrollLeft > 4)
    // Treat "almost scrolled to the end" as the end so sub-pixel widths and
    // padding rounding don't leave the next button enabled forever.
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4)
  }, [])

  // Measure before paint so the controls never flash in the wrong state.
  useLayoutEffect(() => {
    updateScrollIndicators()
  }, [updateScrollIndicators, next24Hours.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    el.addEventListener('scroll', updateScrollIndicators, { passive: true })
    window.addEventListener('resize', updateScrollIndicators)

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateScrollIndicators)
      : null
    observer?.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollIndicators)
      window.removeEventListener('resize', updateScrollIndicators)
      observer?.disconnect()
    }
  }, [updateScrollIndicators])

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return

    // Roughly 80% of the visible strip, with a sensible floor for narrow screens.
    const scrollAmount = Math.max(el.clientWidth * 0.8, 240)
    const reduceMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  if (!next24Hours.length) return null

  return (
    <section aria-label="Hourly forecast" className="animate-fade-in delay-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 className="min-w-0 text-xl font-bold tracking-tight text-text-primary">Hourly Forecast</h2>

        {/* Label + navigation live in the header so they read as part of the section */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <p className="text-sm text-text-tertiary">Next {next24Hours.length} hours</p>
          <div className="flex items-center gap-1.5" role="group" aria-label="Hourly forecast navigation">
            <button
              type="button"
              onClick={() => scrollByAmount('left')}
              disabled={!canScrollLeft}
              aria-controls={listId}
              aria-label="Scroll hourly forecast left"
              title="Previous hours"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-1 text-text-secondary shadow-sm transition-all duration-fast hover:border-border-strong hover:bg-surface-2 hover:text-text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none lg:h-9 lg:w-9"
            >
              <Icon icon="ChevronLeft" size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount('right')}
              disabled={!canScrollRight}
              aria-controls={listId}
              aria-label="Scroll hourly forecast right"
              title="Next hours"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-1 text-text-secondary shadow-sm transition-all duration-fast hover:border-border-strong hover:bg-surface-2 hover:text-text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none lg:h-9 lg:w-9"
            >
              <Icon icon="ChevronRight" size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Left fade gradient */}
        {canScrollLeft && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-r from-surface-0 to-transparent sm:w-20"
            aria-hidden="true"
          />
        )}
        {/* Right fade gradient */}
        {canScrollRight && (
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-l from-surface-0 to-transparent sm:w-20"
            aria-hidden="true"
          />
        )}

        <div
          id={listId}
          ref={scrollRef}
          className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-3 scrollbar-none touch-pan-x sm:gap-3"
          role="list"
          aria-label="Hourly forecast items"
        >
          {next24Hours.map((hour, index) => (
            <HourlyItem
              key={hour.time.toISOString()}
              hour={hour}
              index={index}
              temperatureUnit={temperatureUnit}
              windSpeedUnit={windSpeedUnit}
              use24Hour={use24Hour}
              timezone={timezone}
              isNow={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface HourlyItemProps {
  hour: ProcessedHourlyData
  index: number
  temperatureUnit: TemperatureUnit
  windSpeedUnit: WindSpeedUnit
  use24Hour: boolean
  timezone: string
  isNow: boolean
}

const HourlyItem: FC<HourlyItemProps> = ({
  hour,
  index,
  temperatureUnit,
  windSpeedUnit,
  use24Hour,
  timezone,
  isNow,
}) => {
  const formatOpts = { timeZone: timezone }
  const isDay = isDaytime(hour.time, timezone)
  const visual = getWeatherVisual(hour.weatherCode, isDay)
  const codeInfo = getWeatherCodeInfo(hour.weatherCode, isDay)

  const temp = formatTemperature(hour.temperature, temperatureUnit)
  const wind = formatWindSpeed(hour.windSpeed, windSpeedUnit)
  const timeStr = formatChartHour(hour.time, use24Hour, formatOpts)

  return (
    <article
      className={`animate-slide-up relative flex w-32 shrink-0 flex-col items-center gap-3 rounded-2xl border p-4 transition-all duration-fast ${
        isNow
          ? 'border-brand-primary/40 bg-brand-primary-light/50 dark:bg-brand-primary/10 ring-2 ring-brand-primary/20'
          : 'border-border-subtle bg-surface-1 hover:bg-surface-2 hover:border-border-default hover:shadow-md'
      }`}
      style={{ animationDelay: `${Math.min(index * 30, 360)}ms` }}
      role="listitem"
      aria-label={`${isNow ? 'Now' : timeStr}: ${codeInfo.description}, ${temp}`}
    >
      <time
        className={`text-xs font-semibold ${isNow ? 'text-brand-primary' : 'text-text-tertiary'}`}
        dateTime={hour.time.toISOString()}
      >
        {isNow ? 'Now' : timeStr}
      </time>

      <div className={`flex shrink-0 items-center justify-center rounded-xl ${visual.tileClass}`} style={{ width: '64px', height: '64px' }}>
        <Icon
          icon={visual.icon}
          size={32}
          className={`${visual.iconClass} mt-0.5`}
          aria-hidden="true"
        />
      </div>

      <p className="text-xl font-bold tabular-nums text-text-primary">{temp}</p>

      {/* Precipitation probability */}
      <div
        className="w-full"
        role="img"
        aria-label={`Precipitation probability: ${hour.precipitationProbability}%`}
      >
        <div className="h-2 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${hour.precipitationProbability}%`,
              background: hour.precipitationProbability >= 30
                ? 'linear-gradient(90deg, var(--weather-rain), var(--brand-secondary))'
                : 'var(--border-default)',
            }}
          />
        </div>
        <p className={`mt-1.5 text-center text-xs font-medium tabular-nums ${
          hour.precipitationProbability >= 30 ? 'text-brand-secondary' : 'text-text-quaternary'
        }`}>
          {hour.precipitationProbability}%
        </p>
      </div>

      {/* Wind */}
      <p className="flex items-center gap-1 text-xs tabular-nums text-text-tertiary">
        <Icon icon="Wind" size={11} aria-hidden="true" />
        {wind}
      </p>
    </article>
  )
}

export default HourlyForecast