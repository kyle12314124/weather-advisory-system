/**
 * Application smoke tests
 *
 * Renders the real App component against a mocked Open-Meteo API and
 * verifies the main sections render and the primary interactions work.
 */

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/App'

// ---------------------------------------------------------------------------
// Open-Meteo API mock data
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0')

/** Local-time ISO string like "2026-01-15T14:00" (Open-Meteo format, no offset) */
const localHourISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`

const localDateISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function buildHourly(count: number) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + i, 0, 0)
    return {
      time: localHourISO(time),
      temperature_2m: 30 - i * 0.1,
      relativehumidity_2m: 65,
      apparent_temperature: 30,
      precipitation_probability: 25,
      precipitation: 0,
      weathercode: i % 12 === 0 ? 0 : 2,
      windspeed_10m: 3.5,
      winddirection_10m: 90,
      uv_index: 2,
      visibility: 10000,
    }
  })
}

function buildDaily(count: number) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    return {
      time: localDateISO(date),
      weathercode: 2,
      temperature_2m_max: 32,
      temperature_2m_min: 25,
      apparent_temperature_max: 31,
      apparent_temperature_min: 26,
      precipitation_sum: 1.2,
      precipitation_probability_max: 30,
      windspeed_10m_max: 6,
      winddirection_10m_dominant: 90,
      uv_index_max: 2,
      sunrise: `${localDateISO(date)}T06:12`,
      sunset: `${localDateISO(date)}T17:45`,
    }
  })
}

const WEATHER_RESPONSE = {
  current_weather: {
    temperature: 30.6,
    windspeed: 3.5,
    winddirection: 90,
    weathercode: 2,
    time: localHourISO(new Date()),
  },
  hourly: {
    time: buildHourly(48).map(h => h.time),
    temperature_2m: buildHourly(48).map(h => h.temperature_2m),
    relativehumidity_2m: buildHourly(48).map(h => h.relativehumidity_2m),
    apparent_temperature: buildHourly(48).map(h => h.apparent_temperature),
    precipitation_probability: buildHourly(48).map(h => h.precipitation_probability),
    precipitation: buildHourly(48).map(h => h.precipitation),
    weathercode: buildHourly(48).map(h => h.weathercode),
    windspeed_10m: buildHourly(48).map(h => h.windspeed_10m),
    winddirection_10m: buildHourly(48).map(h => h.winddirection_10m),
    uv_index: buildHourly(48).map(h => h.uv_index),
    visibility: buildHourly(48).map(h => h.visibility),
  },
  daily: {
    time: buildDaily(7).map(d => d.time),
    weathercode: buildDaily(7).map(d => d.weathercode),
    temperature_2m_max: buildDaily(7).map(d => d.temperature_2m_max),
    temperature_2m_min: buildDaily(7).map(d => d.temperature_2m_min),
    apparent_temperature_max: buildDaily(7).map(d => d.apparent_temperature_max),
    apparent_temperature_min: buildDaily(7).map(d => d.apparent_temperature_min),
    precipitation_sum: buildDaily(7).map(d => d.precipitation_sum),
    precipitation_probability_max: buildDaily(7).map(d => d.precipitation_probability_max),
    windspeed_10m_max: buildDaily(7).map(d => d.windspeed_10m_max),
    winddirection_10m_dominant: buildDaily(7).map(d => d.winddirection_10m_dominant),
    uv_index_max: buildDaily(7).map(d => d.uv_index_max),
    sunrise: buildDaily(7).map(d => d.sunrise),
    sunset: buildDaily(7).map(d => d.sunset),
  },
  timezone: 'Asia/Manila',
  timezone_abbreviation: 'PST',
  latitude: 14.5995,
  longitude: 120.9842,
  elevation: 10,
  generationtime_ms: 0.5,
  utc_offset_seconds: 28800,
}

const jsonResponse = (body: unknown) =>
  ({ ok: true, json: async () => body }) as unknown as Response

beforeAll(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => {
    const href = String(url)
    if (href.includes('geocoding-api.open-meteo.com')) {
      return jsonResponse({ results: [] })
    }
    return jsonResponse(WEATHER_RESPONSE)
  }))
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  document.documentElement.classList.remove('dark')
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function renderApp() {
  const result = render(<App />)
  // Wait for the weather hero to render with fetched data
  await screen.findByRole('region', { name: /current weather conditions/i })
  return result
}

describe('App smoke', () => {
  it('renders header, hero, hourly, and daily forecast with fetched data', async () => {
    await renderApp()

    // Brand and header
    expect(screen.getByRole('heading', { name: /weather advisory/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /refresh weather data/i })).toBeTruthy()

    // Hero shows default location and temperature (30.6°C -> "31°C").
    // The name appears in both header location buttons and the hero heading.
    expect(screen.getAllByText('Manila, Philippines').length).toBeGreaterThan(0)
    expect(screen.getByText(/31°C/)).toBeTruthy()
    // Description appears in the hero and in daily rows
    expect(screen.getAllByText(/Partly cloudy/i).length).toBeGreaterThan(0)

    // Forecast sections
    expect(screen.getByText('Hourly Forecast')).toBeTruthy()
    expect(screen.getByText('7-Day Forecast')).toBeTruthy()

    // No critical advisory banner for calm conditions
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('navigates to the advisories tab and distinguishes generated advisories from PAGASA', async () => {
    await renderApp()

    fireEvent.click(screen.getByRole('tab', { name: /advisories/i }))

    await waitFor(() => {
      expect(screen.getByText(/auto-generated/i)).toBeTruthy()
    })
    // Official source link present
    const pagasaLink = screen.getAllByRole('link', { name: /PAGASA/i })[0]
    expect(pagasaLink).toBeTruthy()
    expect((pagasaLink as HTMLAnchorElement).href).toContain('pagasa.dost.gov.ph')
  })

  it('navigates to the charts tab (lazy-loaded)', async () => {
    await renderApp()

    fireEvent.click(screen.getByRole('tab', { name: /charts/i }))

    // Charts are lazy-loaded (recharts chunk) - allow extra time in jsdom
    await waitFor(() => {
      expect(screen.getByText(/Hourly Temperature \(Next 24h\)/i)).toBeTruthy()
    }, { timeout: 15000 })
    expect(screen.getByText(/7-Day Precipitation Forecast/i)).toBeTruthy()
  })

  it('navigates to favorites and shows the empty state', async () => {
    await renderApp()

    fireEvent.click(screen.getByRole('tab', { name: /favorites/i }))

    await waitFor(() => {
      expect(screen.getByText(/no saved locations yet/i)).toBeTruthy()
    })
  })

  it('settings tab toggles are functional (24-hour time switch)', async () => {
    await renderApp()

    fireEvent.click(screen.getByRole('tab', { name: /settings/i }))

    await waitFor(() => {
      expect(screen.getByText('Units')).toBeTruthy()
    })

    const toggle = screen.getByRole('switch', { name: /24-hour time format/i })
    expect(toggle.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(toggle)
    await waitFor(() => {
      expect(toggle.getAttribute('aria-checked')).toBe('true')
    })
  })

  it('opens the change-location dialog and closes it with Escape', async () => {
    await renderApp()

    // Click the search input to open the dialog
    fireEvent.click(screen.getByRole('searchbox', { name: /search location/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /change location/i })).toBeTruthy()
    })
    expect(screen.getByRole('combobox')).toBeTruthy()

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /change location/i })).toBeNull()
    })
  })

  it('puts the location dialog above the dashboard with a real z-index utility', async () => {
    await renderApp()

    fireEvent.click(screen.getByRole('searchbox', { name: /search location/i }))
    const dialog = await screen.findByRole('dialog', { name: /change location/i })

    expect(dialog.className).toContain('z-modal')
    expect(dialog.className).toContain('bg-overlay')
  })

  it('marks the active tab and moves the active state when tabs change', async () => {
    await renderApp()

    const forecastTab = screen.getByRole('tab', { name: /forecast/i })
    expect(forecastTab.getAttribute('data-state')).toBe('active')

    fireEvent.click(screen.getByRole('tab', { name: /charts/i }))

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /charts/i }).getAttribute('data-state')).toBe('active')
    })
    expect(forecastTab.getAttribute('data-state')).toBe('inactive')
  })

  it('switches themes immediately and applies the class to <html>', async () => {
    await renderApp()

    // Default setting is dark.
    expect(document.documentElement).toHaveClass('dark')

    fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }))

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass('dark')
    })

    // The control now offers the inverse action.
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeTruthy()
  })
})
