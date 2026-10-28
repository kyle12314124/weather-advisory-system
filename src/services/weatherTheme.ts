/**
 * Weather Visual Theme
 *
 * Single source of truth for mapping WMO weather codes to visual styles
 * (icon name + accent classes). Classes are written as static strings so
 * Tailwind's compiler can detect them.
 *
 * Consumed by CurrentWeather, HourlyForecast, and DailyForecast to keep
 * weather imagery consistent across the dashboard.
 */

import { getWeatherCodeInfo } from './weatherCodes'

export type WeatherVisualKey =
  | 'sun'
  | 'moon'
  | 'cloud-sun'
  | 'cloud-moon'
  | 'cloud'
  | 'cloud-fog'
  | 'cloud-drizzle'
  | 'cloud-rain'
  | 'cloud-snow'
  | 'cloud-lightning'
  | 'help-circle'

export interface WeatherVisual {
  /** Canonical key (matches getWeatherCodeInfo().icon) */
  key: WeatherVisualKey
  /** Icon name resolvable by the shared Icon component */
  icon: string
  /** Text color classes for weather icons (light + dark) */
  iconClass: string
  /** Background classes for small icon tiles */
  tileClass: string
  /** Very subtle decorative background tint (hero accents only) */
  glowClass: string
}

const VISUALS: Record<WeatherVisualKey, WeatherVisual> = {
  sun: {
    key: 'sun',
    icon: 'Sun',
    iconClass: 'text-amber-600 dark:text-amber-400',
    tileClass: 'bg-amber-500/10 dark:bg-amber-400/10',
    glowClass: 'bg-amber-400/10 dark:bg-amber-400/10',
  },
  moon: {
    key: 'moon',
    icon: 'Moon',
    iconClass: 'text-slate-500 dark:text-slate-400',
    tileClass: 'bg-slate-500/10 dark:bg-slate-400/10',
    glowClass: 'bg-slate-400/10 dark:bg-slate-400/10',
  },
  'cloud-sun': {
    key: 'cloud-sun',
    icon: 'CloudSun',
    iconClass: 'text-sky-600 dark:text-sky-400',
    tileClass: 'bg-sky-500/10 dark:bg-sky-400/10',
    glowClass: 'bg-sky-400/10 dark:bg-sky-400/10',
  },
  'cloud-moon': {
    key: 'cloud-moon',
    icon: 'CloudMoon',
    iconClass: 'text-slate-500 dark:text-slate-400',
    tileClass: 'bg-slate-500/10 dark:bg-slate-400/10',
    glowClass: 'bg-slate-400/10 dark:bg-slate-400/10',
  },
  cloud: {
    key: 'cloud',
    icon: 'Cloud',
    iconClass: 'text-slate-500 dark:text-slate-400',
    tileClass: 'bg-slate-500/10 dark:bg-slate-400/10',
    glowClass: 'bg-slate-400/10 dark:bg-slate-400/10',
  },
  'cloud-fog': {
    key: 'cloud-fog',
    icon: 'CloudFog',
    iconClass: 'text-slate-500 dark:text-slate-400',
    tileClass: 'bg-slate-500/10 dark:bg-slate-400/10',
    glowClass: 'bg-slate-400/10 dark:bg-slate-400/10',
  },
  'cloud-drizzle': {
    key: 'cloud-drizzle',
    icon: 'CloudDrizzle',
    iconClass: 'text-sky-600 dark:text-sky-400',
    tileClass: 'bg-sky-500/10 dark:bg-sky-400/10',
    glowClass: 'bg-sky-400/10 dark:bg-sky-400/10',
  },
  'cloud-rain': {
    key: 'cloud-rain',
    icon: 'CloudRain',
    iconClass: 'text-blue-600 dark:text-blue-400',
    tileClass: 'bg-blue-500/10 dark:bg-blue-400/10',
    glowClass: 'bg-blue-400/10 dark:bg-blue-400/10',
  },
  'cloud-snow': {
    key: 'cloud-snow',
    icon: 'CloudSnow',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    tileClass: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    glowClass: 'bg-cyan-400/10 dark:bg-cyan-400/10',
  },
  'cloud-lightning': {
    key: 'cloud-lightning',
    icon: 'CloudLightning',
    iconClass: 'text-violet-600 dark:text-violet-400',
    tileClass: 'bg-violet-500/10 dark:bg-violet-400/10',
    glowClass: 'bg-violet-400/10 dark:bg-violet-400/10',
  },
  'help-circle': {
    key: 'help-circle',
    icon: 'HelpCircle',
    iconClass: 'text-slate-500 dark:text-slate-400',
    tileClass: 'bg-slate-500/10 dark:bg-slate-400/10',
    glowClass: 'bg-slate-400/10 dark:bg-slate-400/10',
  },
}

/**
 * Get the visual style for a WMO weather code.
 * Falls back to the neutral "unknown" style for unrecognized codes.
 */
export function getWeatherVisual(code: number, isDay: boolean): WeatherVisual {
  const key = getWeatherCodeInfo(code, isDay).icon as WeatherVisualKey
  return VISUALS[key] ?? VISUALS['help-circle']
}

/**
 * UV index progress colors (WHO exposure scale).
 * Returns a subtle two-stop fill used by progress bars.
 * Uses the new warm palette with semantic colors.
 */
export function getUVScaleColor(label: string): string {
  switch (label) {
    case 'Low':
      return 'linear-gradient(90deg, var(--semantic-success), var(--semantic-success-strong))'
    case 'Moderate':
      return 'linear-gradient(90deg, var(--semantic-warning), var(--semantic-warning-strong))'
    case 'High':
      return 'linear-gradient(90deg, var(--semantic-warning-strong), var(--semantic-danger))'
    case 'Very High':
      return 'linear-gradient(90deg, var(--semantic-danger), var(--semantic-danger-strong))'
    case 'Extreme':
      return 'linear-gradient(90deg, var(--semantic-danger-strong), var(--semantic-danger))'
    default:
      return 'linear-gradient(90deg, var(--semantic-info), var(--semantic-info-strong))'
  }
}