/**
 * Regression tests for the location search combobox.
 *
 * These cover the portal/fixed-positioning behaviour, pointer selection,
 * keyboard navigation, dismissal, and async states that were broken when the
 * dashboard stacked above the suggestion list.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { LocationSearch } from '../src/components/LocationSearch'
import type { GeocodingResult } from '../src/types/location'

const MANILA: GeocodingResult = {
  id: 1,
  name: 'Manila',
  latitude: 14.5995,
  longitude: 120.9842,
  elevation: 13,
  feature_code: 'PPLC',
  country_code: 'PH',
  timezone: 'Asia/Manila',
  population: 1600000,
  country_id: 1,
  country: 'Philippines',
  admin1: 'National Capital Region',
}

const TOKYO: GeocodingResult = {
  id: 2,
  name: 'Tokyo',
  latitude: 35.6762,
  longitude: 139.6503,
  elevation: 40,
  feature_code: 'PPLC',
  country_code: 'JP',
  timezone: 'Asia/Tokyo',
  population: 9000000,
  country_id: 2,
  country: 'Japan',
  admin1: 'Tokyo',
}

interface Overrides {
  query?: string
  suggestions?: GeocodingResult[]
  isLoading?: boolean
  error?: string | null
  selectedLocation?: GeocodingResult | null
}

function renderSearch(overrides: Overrides = {}) {
  const props = {
    query: 'Man',
    suggestions: [MANILA, TOKYO],
    isLoading: false,
    error: null as string | null,
    selectedLocation: null as GeocodingResult | null,
    onQueryChange: vi.fn(),
    onSelect: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  }

  const view = render(<LocationSearch {...props} />)
  const input = screen.getByRole('combobox') as HTMLInputElement
  fireEvent.focus(input)
  return { ...props, input, view }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('LocationSearch', () => {
  it('renders suggestions in a fixed-position portal above dashboard layers', async () => {
    renderSearch()

    const listbox = await screen.findByRole('listbox', { name: /location suggestions/i })

    // Portaled out of the modal/card tree so overflow clipping cannot apply.
    expect(listbox.parentElement).toBe(document.body)
    expect(listbox.className).toContain('fixed')
    expect(listbox.style.zIndex).toBe('var(--z-popover)')
    expect(listbox.style.maxHeight).toBeTruthy()
    expect(screen.getByRole('option', { name: /Manila/ })).toBeTruthy()
    expect(screen.getByRole('option', { name: /Tokyo/ })).toBeTruthy()
  })

  it('selects a suggestion on pointer press (mouse/touch/pen)', async () => {
    const { onSelect } = renderSearch()

    const option = await screen.findByRole('option', { name: /Manila/ })
    fireEvent.pointerDown(option)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(MANILA)
  })

  it('supports keyboard navigation and Enter selection', async () => {
    const { onSelect, input } = renderSearch()

    const firstOption = await screen.findByRole('option', { name: /Manila/ })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => expect(firstOption.getAttribute('aria-selected')).toBe('true'))
    expect(input.getAttribute('aria-activedescendant')).toBe(firstOption.id)

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Tokyo/ }).getAttribute('aria-selected')).toBe('true')
    })

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith(TOKYO)
  })

  it('supports Home/End and wraps arrow navigation', async () => {
    const { input } = renderSearch()
    const options = await screen.findAllByRole('option')

    fireEvent.keyDown(input, { key: 'End' })
    await waitFor(() => expect(options[1].getAttribute('aria-selected')).toBe('true'))

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => expect(options[0].getAttribute('aria-selected')).toBe('true'))

    fireEvent.keyDown(input, { key: 'Home' })
    await waitFor(() => expect(options[0].getAttribute('aria-selected')).toBe('true'))
  })

  it('dismisses when pressing outside the field or list', async () => {
    renderSearch()
    await screen.findByRole('listbox')

    fireEvent.pointerDown(document.body)

    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('reopens the list when typing after an outside dismissal', async () => {
    const { input, onQueryChange } = renderSearch()
    await screen.findByRole('listbox')

    fireEvent.pointerDown(document.body)
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())

    // The input can keep DOM focus after a non-focusable outside target is
    // pressed, so a new keystroke must bring the suggestions back.
    fireEvent.change(input, { target: { value: 'Manil' } })

    expect(onQueryChange).toHaveBeenCalledWith('Manil')
    expect(await screen.findByRole('listbox')).toBeInTheDocument()
  })

  it('Escape closes the list without clearing the query', async () => {
    const { input, onClear } = renderSearch()
    await screen.findByRole('listbox')

    fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(onClear).not.toHaveBeenCalled()
  })

  it('shows the loading state while searching', async () => {
    renderSearch({ isLoading: true, suggestions: [] })

    expect(await screen.findByRole('status')).toHaveTextContent(/searching locations/i)
    expect(screen.getByRole('listbox').getAttribute('aria-busy')).toBe('true')
  })

  it('shows errors and empty results inside the dropdown', async () => {
    renderSearch({ error: 'Network unavailable', suggestions: [] })

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable')

    cleanup()
    renderSearch({ error: null, suggestions: [] })

    expect(await screen.findByText(/no locations found/i)).toBeInTheDocument()
    expect(screen.getByText(/try a different search term/i)).toBeInTheDocument()
  })

  it('shows the selected location and hides the suggestion list', async () => {
    renderSearch({ selectedLocation: MANILA, query: 'Manila' })

    expect(screen.getByText(/selected: manila/i)).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
