/**
 * Hourly forecast navigation regression tests.
 *
 * The previous/next controls used to be positioned with offsets but no
 * `absolute` class, so they dropped out of the header and rendered as a stray
 * row below the cards. These tests pin the controls to the header, their
 * disabled edges, and the scroll direction they trigger.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HourlyForecast } from '../src/components/HourlyForecast'
import type { ProcessedHourlyData } from '../src/types/weather'

const geometry = { scrollLeft: 0, scrollWidth: 1000, clientWidth: 300 }

function buildHourly(count: number): ProcessedHourlyData[] {
  const start = Date.UTC(2026, 9, 28, 15, 0, 0)
  return Array.from({ length: count }, (_, index) => ({
    time: new Date(start + index * 60 * 60 * 1000),
    temperature: 30 - index * 0.1,
    feelsLike: 32 - index * 0.1,
    humidity: 60,
    precipitationProbability: index % 3 === 0 ? 35 : 5,
    precipitation: 0,
    weatherCode: index % 2 === 0 ? 1 : 2,
    windSpeed: 5,
    windDirection: 180,
    uvIndex: 3,
    visibility: 20000,
  }))
}

function renderForecast() {
  return render(
    <HourlyForecast
      hourly={buildHourly(24)}
      temperatureUnit="celsius"
      windSpeedUnit="kmh"
      use24Hour={false}
      timezone="UTC"
    />
  )
}

const prevButton = () => screen.getByRole('button', { name: 'Scroll hourly forecast left' })
const nextButton = () => screen.getByRole('button', { name: 'Scroll hourly forecast right' })

describe('HourlyForecast navigation', () => {
  beforeEach(() => {
    geometry.scrollLeft = 0
    geometry.scrollWidth = 1000
    geometry.clientWidth = 300

    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => geometry.scrollWidth,
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => geometry.clientWidth,
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      get: () => geometry.scrollLeft,
      set: value => { geometry.scrollLeft = value },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (HTMLElement.prototype as { scrollWidth?: unknown }).scrollWidth
    delete (HTMLElement.prototype as { clientWidth?: unknown }).clientWidth
    delete (HTMLElement.prototype as { scrollLeft?: unknown }).scrollLeft
  })

  it('renders both controls in the section header, not below the cards', () => {
    renderForecast()

    const heading = screen.getByRole('heading', { name: 'Hourly Forecast' })
    const group = screen.getByRole('group', { name: 'Hourly forecast navigation' })
    const list = screen.getByRole('list', { name: 'Hourly forecast items' })

    expect(heading.parentElement).toContainElement(group)
    expect(group).toContainElement(prevButton())
    expect(group).toContainElement(nextButton())
    expect(list.contains(prevButton())).toBe(false)
    expect(list.contains(nextButton())).toBe(false)
  })

  it('disables previous at the start and next at the end', () => {
    renderForecast()

    expect(prevButton()).toBeDisabled()
    expect(nextButton()).toBeEnabled()

    const list = screen.getByRole('list', { name: 'Hourly forecast items' })
    geometry.scrollLeft = 700 // scrollWidth - clientWidth
    fireEvent.scroll(list)

    expect(prevButton()).toBeEnabled()
    expect(nextButton()).toBeDisabled()
  })

  it('moves forward and backward by a viewport-sized step', () => {
    renderForecast()

    const list = screen.getByRole('list', { name: 'Hourly forecast items' })
    const scrollBy = vi.fn()
    list.scrollBy = scrollBy

    fireEvent.click(nextButton())
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 240, behavior: 'smooth' })

    geometry.scrollLeft = 300
    fireEvent.scroll(list)
    fireEvent.click(prevButton())
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -240, behavior: 'smooth' })
  })

  it('does not enable either arrow when the strip does not overflow', () => {
    geometry.scrollWidth = 300
    renderForecast()

    expect(prevButton()).toBeDisabled()
    expect(nextButton()).toBeDisabled()
  })

  it('keeps all 24 hours and their weather details', () => {
    renderForecast()

    expect(screen.getAllByRole('listitem')).toHaveLength(24)
    expect(screen.getByText('Now')).toBeInTheDocument()
    expect(screen.getByText('Next 24 hours')).toBeInTheDocument()
  })

  it('renders nothing without hourly data', () => {
    const { container } = render(
      <HourlyForecast
        hourly={[]}
        temperatureUnit="celsius"
        windSpeedUnit="kmh"
        use24Hour={false}
        timezone="UTC"
      />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
