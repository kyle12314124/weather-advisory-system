/**
 * Hook for fetching and managing weather data from Open-Meteo API
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { getWeatherForecast, getCurrentWeather } from '../api/openMeteo'
import type {
  WeatherData,
  CurrentWeather,
  ProcessedHourlyData,
  ProcessedDailyData,
  LocationInfo,
} from '../types/weather'
import { parseAPITime, parseAPIDate } from '../utils/date'

interface WeatherState {
  current: CurrentWeather | null
  hourly: ProcessedHourlyData[]
  daily: ProcessedDailyData[]
  location: LocationInfo | null
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  isMockData: boolean
}

interface UseWeatherOptions {
  latitude: number
  longitude: number
  timezone: string
  enabled?: boolean
  onError?: (error: Error) => void
  autoRefresh?: boolean
  refreshInterval?: number // minutes
}

export function useWeather({
  latitude,
  longitude,
  timezone,
  enabled = true,
  onError,
  autoRefresh = true,
  refreshInterval = 30,
}: UseWeatherOptions) {
  const [state, setState] = useState<WeatherState>({
    current: null,
    hourly: [],
    daily: [],
    location: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    isMockData: false,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  // Track previous coordinates to detect location changes
  const prevLatitudeRef = useRef<number | undefined>(undefined)
  const prevLongitudeRef = useRef<number | undefined>(undefined)
  const prevTimezoneRef = useRef<string | undefined>(undefined)

  // Track if we should fetch
  const shouldFetchRef = useRef(enabled)

  // Track if initial fetch has been done
  const initialFetchDoneRef = useRef(false)

  useEffect(() => {
    shouldFetchRef.current = enabled
  }, [enabled])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Process raw API data into typed, usable format
  const processWeatherData = useCallback((
    data: WeatherData,
    locationInfo: LocationInfo,
    timezone: string
  ): Omit<WeatherState, 'isLoading' | 'error' | 'lastUpdated' | 'isMockData'> => {
    const { current_weather, hourly, daily } = data

    // Process current weather
    const current: CurrentWeather = {
      ...current_weather,
      relativehumidity_2m: hourly.relativehumidity_2m[0],
      apparent_temperature: hourly.apparent_temperature[0],
      precipitation: hourly.precipitation[0],
      // surface_pressure is not in hourly by default, only in current_weather
      uv_index: hourly.uv_index?.[0],
      visibility: hourly.visibility?.[0],
    }

    // Process hourly data (next 48 hours)
    const hourlyData: ProcessedHourlyData[] = hourly.time
      .map((timeStr, index) => {
        const time = parseAPITime(timeStr, timezone)
        const weatherCode = hourly.weathercode[index]

        return {
          time,
          temperature: hourly.temperature_2m[index],
          feelsLike: hourly.apparent_temperature[index],
          humidity: hourly.relativehumidity_2m[index],
          precipitationProbability: hourly.precipitation_probability[index],
          precipitation: hourly.precipitation[index],
          weatherCode,
          windSpeed: hourly.windspeed_10m[index],
          windDirection: hourly.winddirection_10m[index],
          uvIndex: hourly.uv_index?.[index],
          visibility: hourly.visibility?.[index],
        }
      })
      .filter(item => item.time >= new Date()) // Only future hours
      .slice(0, 48) // Limit to 48 hours

    // Process daily data (7 days)
    const dailyData: ProcessedDailyData[] = daily.time.map((dateStr, index) => {
      const date = parseAPIDate(dateStr, timezone)
      const weatherCode = daily.weathercode[index]

      return {
        date,
        weatherCode,
        tempMax: daily.temperature_2m_max[index],
        tempMin: daily.temperature_2m_min[index],
        feelsLikeMax: daily.apparent_temperature_max[index],
        feelsLikeMin: daily.apparent_temperature_min[index],
        precipitationSum: daily.precipitation_sum[index],
        precipitationProbability: daily.precipitation_probability_max[index],
        windSpeedMax: daily.windspeed_10m_max[index],
        windDirection: daily.winddirection_10m_dominant[index],
        uvIndexMax: daily.uv_index_max?.[index],
        sunrise: daily.sunrise ? parseAPITime(daily.sunrise[index], timezone) : undefined,
        sunset: daily.sunset ? parseAPITime(daily.sunset[index], timezone) : undefined,
      }
    })

    return {
      current,
      hourly: hourlyData,
      daily: dailyData,
      location: locationInfo,
    }
  }, [])

  // Fetch full forecast
  const fetchWeather = useCallback(async (showLoading = true) => {
    if (!shouldFetchRef.current || !isMountedRef.current) return

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      const data = await getWeatherForecast(latitude, longitude, timezone)

      if (!isMountedRef.current) return

      const locationInfo: LocationInfo = {
        id: `loc_${latitude}_${longitude}`,
        name: '', // Will be set by parent
        latitude,
        longitude,
        elevation: data.elevation,
        timezone: data.timezone,
        country: '',
        admin1: '',
        admin2: '',
      }

      const processed = processWeatherData(data, locationInfo, timezone)

      setState(prev => ({
        ...prev,
        ...processed,
        isLoading: false,
        lastUpdated: new Date(),
        isMockData: false,
      }))
    } catch (error) {
      if (!isMountedRef.current) return

      if (error instanceof Error && error.name === 'AbortError') {
        return // Ignore aborted requests
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather data'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))

      if (onError) {
        onError(new Error(errorMessage))
      }
    }
  }, [latitude, longitude, timezone, processWeatherData, onError])

  // Fetch current weather only (for quick refresh)
  const fetchCurrentWeather = useCallback(async () => {
    if (!shouldFetchRef.current || !isMountedRef.current) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const current = await getCurrentWeather(latitude, longitude, timezone)

      if (!isMountedRef.current) return

      // Update just the current weather in state
      setState(prev => ({
        ...prev,
        current: {
          ...current,
          relativehumidity_2m: prev.hourly[0]?.humidity ?? current.relativehumidity_2m,
          apparent_temperature: prev.hourly[0]?.feelsLike ?? current.apparent_temperature,
          precipitation: prev.hourly[0]?.precipitation ?? current.precipitation,
          uv_index: prev.hourly[0]?.uvIndex ?? current.uv_index,
          visibility: prev.hourly[0]?.visibility ?? current.visibility,
        },
        lastUpdated: new Date(),
        error: null,
      }))
    } catch (error) {
      if (!isMountedRef.current) return

      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch current weather'
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }))
    }
  }, [latitude, longitude, timezone])

  // Refresh weather data
  const refresh = useCallback(() => {
    fetchWeather(true)
  }, [fetchWeather])

  // Combined effect for initial fetch and coordinate changes
  // This replaces the two separate effects to prevent double fetching
  useEffect(() => {
    if (!enabled) return

    const coordsChanged =
      latitude !== prevLatitudeRef.current ||
      longitude !== prevLongitudeRef.current ||
      timezone !== prevTimezoneRef.current

    // On initial mount, prev refs are undefined, so coordsChanged will be true
    // We only want to fetch on initial mount OR when coordinates actually change
    if (!initialFetchDoneRef.current || coordsChanged) {
      // Set loading state if coordinates changed (not initial fetch)
      if (coordsChanged && prevLatitudeRef.current !== undefined) {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
      }

      // Trigger fetch
      fetchWeather(!initialFetchDoneRef.current) // showLoading only on initial fetch or explicit coordinate change

      initialFetchDoneRef.current = true
      prevLatitudeRef.current = latitude
      prevLongitudeRef.current = longitude
      prevTimezoneRef.current = timezone
    }
  }, [enabled, latitude, longitude, timezone, fetchWeather])

  // Auto-refresh interval (if enabled in settings)
  useEffect(() => {
    if (!enabled || !autoRefresh) return

    const interval = setInterval(() => {
      fetchWeather(false) // Silent refresh
    }, refreshInterval * 60 * 1000)

    return () => clearInterval(interval)
  }, [enabled, autoRefresh, refreshInterval, fetchWeather])

  return {
    ...state,
    fetchWeather,
    fetchCurrentWeather,
    refresh,
  }
}