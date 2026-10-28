/**
 * Current Weather Display Component - Premium Redesign
 * Hero section with atmospheric condition imagery, key statistics, and UV index.
 * Fully responsive across all viewport sizes with polished interactions.
 */

import { type FC } from 'react'
import { Icon } from './Icon'
import { Badge } from './Badge'
import { Card } from './Card'
import {
  formatTemperature,
  formatWindSpeed,
  formatHumidity,
  formatUVIndex,
  getUVIndexCategory,
  formatVisibility,
  formatPressure,
  formatPrecipitation,
} from '../utils/units'
import { formatTime, isDaytime } from '../utils/date'
import { getWeatherCodeInfo } from '../services/weatherCodes'
import { getWeatherVisual, getUVScaleColor } from '../services/weatherTheme'
import companionArt from '../assets/weather-companion.png'
import type { CurrentWeather as CurrentWeatherType } from '../types/weather'
import type { TemperatureUnit, WindSpeedUnit, PrecipitationUnit } from '../types/settings'

interface CurrentWeatherProps {
  current: CurrentWeatherType
  temperatureUnit: TemperatureUnit
  windSpeedUnit: WindSpeedUnit
  precipitationUnit: PrecipitationUnit
  showUVIndex: boolean
  locationName: string
  lastUpdated: Date | null
  use24Hour: boolean
  timezone: string
}

interface WeatherDetailProps {
  icon: string
  label: string
  value: string
  iconRotation?: number
}

const WeatherDetail: FC<WeatherDetailProps> = ({ icon, label, value, iconRotation }) => (
  <div className="card-filled p-4 sm:p-5 transition-all duration-fast hover:bg-surface-3 hover:shadow-sm">
    <div className="flex items-center gap-1.5 text-text-tertiary">
      <Icon
        icon={icon}
        size={14}
        aria-hidden="true"
        style={iconRotation !== undefined ? { transform: `rotate(${iconRotation}deg)` } : undefined}
      />
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <p className="mt-2 text-xl font-bold tabular-nums text-text-primary sm:text-2xl">{value}</p>
  </div>
)

const WIND_CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

const getWindCardinal = (degrees: number): string => {
  const normalized = ((degrees % 360) + 360) % 360
  return WIND_CARDINALS[Math.round(normalized / 22.5) % 16]
}

const getUVBadgeVariant = (label: string): 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'outline' => {
  switch (label) {
    case 'Low': return 'success'
    case 'Moderate': return 'info'
    case 'High': return 'warning'
    case 'Very High': return 'danger'
    case 'Extreme': return 'danger'
    default: return 'default'
  }
}

const getUVAdvice = (label: string): string => {
  switch (label) {
    case 'Low': return 'Minimal protection needed. Enjoy the outdoors!'
    case 'Moderate': return 'Wear sunscreen if outdoors for extended periods. A hat helps.'
    case 'High': return 'Apply SPF 30+ sunscreen. Wear a wide-brim hat and UV-blocking sunglasses.'
    case 'Very High': return 'Use SPF 30+ sunscreen. Seek shade during peak hours (10 AM - 4 PM).'
    case 'Extreme': return 'Avoid sun exposure 10 AM - 4 PM. Use SPF 50+, protective clothing, and shade.'
    default: return ''
  }
}

export const CurrentWeather: FC<CurrentWeatherProps> = ({
  current,
  temperatureUnit,
  windSpeedUnit,
  precipitationUnit,
  showUVIndex,
  locationName,
  lastUpdated,
  use24Hour,
  timezone,
}) => {
  if (!current) return null

  // Parse current.time in the location's timezone
  const currentTime = new Date(current.time)
  const isDay = isDaytime(currentTime, timezone)
  const visual = getWeatherVisual(current.weathercode, isDay)
  const codeInfo = getWeatherCodeInfo(current.weathercode, isDay)

  const temp = formatTemperature(current.temperature, temperatureUnit)
  const feelsLike = current.apparent_temperature !== undefined
    ? formatTemperature(current.apparent_temperature, temperatureUnit)
    : null
  const humidity = current.relativehumidity_2m !== undefined
    ? formatHumidity(current.relativehumidity_2m)
    : null
  const windSpeed = formatWindSpeed(current.windspeed, windSpeedUnit)
  const precipitation = current.precipitation !== undefined
    ? formatPrecipitation(current.precipitation, precipitationUnit)
    : '—'
  const uvIndex = current.uv_index !== undefined
    ? formatUVIndex(current.uv_index)
    : null
  const uvCategory = current.uv_index !== undefined
    ? getUVIndexCategory(current.uv_index)
    : null
  const visibility = current.visibility !== undefined
    ? formatVisibility(current.visibility, temperatureUnit === 'fahrenheit')
    : '—'
  const pressure = current.surface_pressure !== undefined
    ? formatPressure(current.surface_pressure, temperatureUnit === 'fahrenheit')
    : '—'

  const formatOpts = { timeZone: timezone }

  return (
    <section className="animate-fade-in delay-1" aria-label="Current weather conditions">
      {/* Location and update time */}
      <div className="mb-5 flex items-center gap-3 sm:gap-4">
        <div className="icon-container icon-container-lg icon-container-brand">
          <Icon icon="MapPin" size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl truncate">
            {locationName}
          </h2>
          <p className="mt-1 text-sm text-text-tertiary sm:text-base flex items-center gap-2">
            <span>{lastUpdated ? `Updated ${formatTime(lastUpdated, use24Hour, formatOpts)}` : 'Loading…'}</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="hidden capitalize sm:inline">{isDay ? 'Daytime' : 'Nighttime'}</span>
          </p>
        </div>
      </div>

      {/* Hero card - responsive layout with atmospheric depth */}
      <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-1 shadow-xl sm:shadow-2xl">
        {/* Subtle atmospheric glow based on condition */}
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl opacity-50 ${visual.glowClass}`}
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-7">
          {/* Condition and temperature - centered on mobile, left-aligned on desktop */}
          <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left lg:w-1/2 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 flex-col items-center gap-4 sm:items-start">
              <div className={`flex shrink-0 items-center justify-center rounded-2xl ${visual.tileClass} shadow-lg`} style={{ width: '100px', height: '100px' }}>
                <Icon
                  icon={visual.icon}
                  size={56}
                  className={visual.iconClass}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-5xl font-bold leading-none tracking-tight tabular-nums text-text-primary sm:text-6xl md:text-7xl lg:text-8xl">
                  {temp}
                </p>
                <p className="mt-2 text-lg font-medium capitalize text-text-secondary sm:text-xl lg:text-2xl">
                  {codeInfo.description}
                </p>
                {feelsLike && (
                  <p className="mt-2 text-base text-text-tertiary">
                    Feels like <span className="font-semibold text-text-primary">{feelsLike}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Anime Companion - responsive, near-native size (312×279), shows full artwork */}
            <div className="hidden md:flex md:items-center md:justify-center lg:w-[280px] lg:flex-none">
              <div
                className="relative shrink-0 rounded-2xl overflow-hidden shadow-xl"
                style={{
                  width: 'clamp(160px, 22vw, 280px)',
                  height: `clamp(143px, 19.7vw, 250px)`,
                }}
                aria-hidden="true"
              >
                {/* Subtle glow matching weather condition */}
                <div
                  className={`pointer-events-none absolute inset-0 opacity-30 ${visual.glowClass}`}
                  aria-hidden="true"
                />
                <img
                  src={companionArt}
                  alt=""
                  width={312}
                  height={279}
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Key statistics - responsive grid */}
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-md lg:grid-cols-2 lg:gap-4">
            <WeatherDetail icon="Droplet" label="Humidity" value={humidity ?? '—'} />
            <WeatherDetail icon="Wind" label="Wind" value={windSpeed} />
            {current.winddirection !== undefined && (
              <WeatherDetail
                icon="ArrowUp"
                label="Wind Dir"
                value={`${Math.round(current.winddirection)}° ${getWindCardinal(current.winddirection)}`}
                iconRotation={current.winddirection}
              />
            )}
            <WeatherDetail icon="Droplets" label="Precip" value={precipitation} />
            <WeatherDetail icon="Eye" label="Visibility" value={visibility} />
            <WeatherDetail icon="Gauge" label="Pressure" value={pressure} />
          </div>
        </div>
      </div>

      {/* UV Index - responsive with beautiful progress */}
      {showUVIndex && uvIndex && uvCategory && (
        <div className="mt-6 animate-slide-up delay-2">
          <Card variant="elevated" padding="lg">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="icon-container icon-container-md icon-container-accent">
                <Icon icon="Sun" size={22} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-text-primary">UV Index</h3>
                <p className="text-xs text-text-tertiary">{uvCategory.label} exposure</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-3xl font-bold tabular-nums text-text-primary sm:text-4xl">{uvIndex}</span>
                <Badge variant={getUVBadgeVariant(uvCategory.label)} size="lg" dot>{uvCategory.label}</Badge>
              </div>
            </div>
            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface-3"
              role="progressbar"
              aria-valuenow={current.uv_index}
              aria-valuemin={0}
              aria-valuemax={11}
              aria-label={`UV Index ${current.uv_index} out of 11`}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min((current.uv_index ?? 0) / 11, 1) * 100}%`,
                  background: getUVScaleColor(uvCategory.label),
                }}
              />
            </div>
            <p className="mt-3 text-sm text-text-secondary">{getUVAdvice(uvCategory.label)}</p>
          </Card>
        </div>
      )}
    </section>
  )
}

export default CurrentWeather