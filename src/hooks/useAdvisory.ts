/**
 * Hook for generating weather advisories from weather data
 */

import { useMemo } from 'react'
import { generateAdvisories, type WeatherAdvisory, PAGASA_URL, ADVISORY_DISCLAIMER } from '../services/advisoryEngine'
import type { ProcessedHourlyData, ProcessedDailyData, CurrentWeather } from '../types/weather'

export function useAdvisory(
  current: CurrentWeather | null,
  hourly: ProcessedHourlyData[],
  daily: ProcessedDailyData[]
) {
  const advisories = useMemo(() => {
    if (!current && hourly.length === 0 && daily.length === 0) {
      return []
    }

    // Convert CurrentWeather to ProcessedHourlyData format if needed
    const processedCurrent = current ? {
      time: new Date(current.time),
      temperature: current.temperature,
      feelsLike: current.apparent_temperature ?? current.temperature,
      humidity: current.relativehumidity_2m ?? 50,
      precipitationProbability: current.precipitation !== undefined ? (current.precipitation > 0 ? 100 : 0) : 0,
      precipitation: current.precipitation ?? 0,
      weatherCode: current.weathercode,
      windSpeed: current.windspeed,
      windDirection: current.winddirection,
      uvIndex: current.uv_index,
      visibility: current.visibility,
    } as ProcessedHourlyData : null

    return generateAdvisories(processedCurrent, hourly, daily)
  }, [current, hourly, daily])

  // Group advisories by severity
  const advisoriesBySeverity = useMemo(() => {
    const grouped: Record<string, WeatherAdvisory[]> = {
      danger: [],
      warning: [],
      info: [],
    }

    for (const advisory of advisories) {
      grouped[advisory.severity].push(advisory)
    }

    return grouped
  }, [advisories])

  // Get highest severity
  const highestSeverity = useMemo((): 'danger' | 'warning' | 'info' | null => {
    if (advisoriesBySeverity.danger.length > 0) return 'danger'
    if (advisoriesBySeverity.warning.length > 0) return 'warning'
    if (advisoriesBySeverity.info.length > 0) return 'info'
    return null
  }, [advisoriesBySeverity])

  // Get advisories for a specific category
  const getAdvisoriesByCategory = useMemo(() => {
    return (category: string) => advisories.filter(a => a.category === category)
  }, [advisories])

  // Check if there are any critical advisories
  const hasCriticalAdvisories = useMemo(() => {
    return advisoriesBySeverity.danger.length > 0 || advisoriesBySeverity.warning.length > 0
  }, [advisoriesBySeverity])

  return {
    advisories,
    advisoriesBySeverity,
    highestSeverity,
    hasCriticalAdvisories,
    getAdvisoriesByCategory,
    pagasaUrl: PAGASA_URL,
    disclaimer: ADVISORY_DISCLAIMER,
  }
}