/**
 * Open-Meteo API Client
 * Handles geocoding and weather forecast requests
 * https://open-meteo.com/
 */

import type { GeocodingResult, GeocodingResponse } from '../types/location'
import type { WeatherData } from '../types/weather'

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1'
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000

/**
 * Creates an AbortController with timeout
 */
function createTimeoutController(timeout: number = REQUEST_TIMEOUT): AbortController {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)
  return controller
}

/**
 * Fetch with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = createTimeoutController()
  const { signal, ...restOptions } = options

  // Combine signals if external signal provided
  let finalSignal = controller.signal
  let cleanup: (() => void) | null = null

  if (signal) {
    const combinedController = new AbortController()

    const abortHandler = () => combinedController.abort()

    // If the external signal is already aborted, abort immediately
    if (signal.aborted) {
      combinedController.abort()
    } else {
      signal.addEventListener('abort', abortHandler)
    }

    // Also listen for our internal timeout
    controller.signal.addEventListener('abort', abortHandler)

    finalSignal = combinedController.signal

    // Clean up event listeners when done
    cleanup = () => {
      if (!signal.aborted) {
        signal.removeEventListener('abort', abortHandler)
      }
      controller.signal.removeEventListener('abort', abortHandler)
    }
  }

  try {
    const response = await fetch(url, { ...restOptions, signal: finalSignal })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  } catch (error) {
    // Clean up event listeners
    if (cleanup) {
      cleanup()
    }

    // Distinguish between timeout and external cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      // If the external signal was aborted, it's a cancellation, not a timeout
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      // Otherwise it's our internal timeout
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Search for locations by name
 */
export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    name: query.trim(),
    count: '10',
    language: 'en',
    format: 'json',
  })

  const url = `${GEOCODING_BASE_URL}/search?${params.toString()}`

  try {
    const response = await fetchWithTimeout(url, { signal })
    const data: GeocodingResponse = await response.json()

    if (!data.results || data.results.length === 0) {
      return []
    }

    // Filter and sort results - prefer cities and populated places
    // Include all populated place feature codes (PPL, PPLA, PPLA2, PPLA3, PPLA4, PPLC, PPLL, PPLG, PPLH)
    return data.results
      .filter(result => result.population > 0 || result.feature_code?.startsWith('PPL'))
      .sort((a, b) => (b.population || 0) - (a.population || 0))
  } catch (error) {
    console.error('Geocoding search failed:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to search locations')
  }
}

/**
 * Get weather forecast for coordinates
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  timezone: string = 'auto'
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current_weather: 'true',
    hourly: [
      'temperature_2m',
      'relativehumidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weathercode',
      'windspeed_10m',
      'winddirection_10m',
      'uv_index',
      'visibility',
    ].join(','),
    daily: [
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'windspeed_10m_max',
      'winddirection_10m_dominant',
      'uv_index_max',
      'sunrise',
      'sunset',
    ].join(','),
    timezone,
    forecast_days: '7',
  })

  const url = `${FORECAST_BASE_URL}?${params.toString()}`

  try {
    const response = await fetchWithTimeout(url)
    const data: WeatherData = await response.json()

    // Validate response structure
    if (!data.current_weather || !data.hourly || !data.daily) {
      throw new Error('Invalid weather data received')
    }

    return data
  } catch (error) {
    console.error('Weather forecast failed:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data')
  }
}

/**
 * Get current weather only (lighter request)
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
  timezone: string = 'auto'
): Promise<WeatherData['current_weather']> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current_weather: 'true',
    timezone,
  })

  const url = `${FORECAST_BASE_URL}?${params.toString()}`

  try {
    const response = await fetchWithTimeout(url)
    const data = await response.json()
    return data.current_weather
  } catch (error) {
    console.error('Current weather fetch failed:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch current weather')
  }
}