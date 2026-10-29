/**
 * Location Search Component - Premium Redesign
 * Accessible combobox autocomplete for cities/municipalities
 * using the Open-Meteo Geocoding API.
 *
 * The suggestion list is rendered in a portal and positioned with fixed
 * coordinates calculated from the input. This keeps it above the dashboard
 * and outside any ancestor `overflow` clipping (modal panels, cards, etc.).
 */

import {
  type CSSProperties,
  type FC,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { Input } from './Input'
import { Button } from './Button'
import type { GeocodingResult } from '../types/location'

interface LocationSearchProps {
  query: string
  suggestions: GeocodingResult[]
  isLoading: boolean
  error: string | null
  selectedLocation: GeocodingResult | null
  onQueryChange: (query: string) => void
  onSelect: (location: GeocodingResult) => void
  onClear: () => void
  placeholder?: string
}

interface DropdownLayout {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

interface DropdownProps {
  listboxId: string
  suggestions: GeocodingResult[]
  isLoading: boolean
  error: string | null
  highlightedIndex: number
  onHighlightedIndexChange: (index: number) => void
  onSelect: (location: GeocodingResult) => void
  formatLocationName: (location: GeocodingResult) => string
  formatPopulation: (population: number) => string
  layout: DropdownLayout
  dropdownRef: RefObject<HTMLDivElement | null>
}

const Dropdown: FC<DropdownProps> = ({
  listboxId,
  suggestions,
  isLoading,
  error,
  highlightedIndex,
  onHighlightedIndexChange,
  onSelect,
  formatLocationName,
  formatPopulation,
  layout,
  dropdownRef,
}) => {
  useEffect(() => {
    if (highlightedIndex < 0) return
    // useId() values can contain characters that are invalid in CSS selectors,
    // so look the option up by id instead of querySelector(`#...`).
    const item = document.getElementById(`${listboxId}-opt-${highlightedIndex}`)
    item?.scrollIntoView?.({ block: 'nearest' })
  }, [highlightedIndex, listboxId])

  return (
    <div
      ref={dropdownRef}
      id={listboxId}
      role="listbox"
      aria-label="Location suggestions"
      aria-busy={isLoading}
      className="animate-scale-in fixed overflow-y-auto overscroll-contain rounded-2xl border border-border-default bg-surface-elevated shadow-2xl"
      style={{
        top: layout.top,
        bottom: layout.bottom,
        left: layout.left,
        width: layout.width,
        maxHeight: layout.maxHeight,
        zIndex: 'var(--z-popover)',
      } as CSSProperties}
    >
      {isLoading && (
        <div className="flex items-center justify-center gap-3 px-4 py-8 text-text-tertiary" role="status">
          <Icon icon="Loader" size={20} className="animate-spin text-brand-primary" aria-hidden="true" />
          <span className="text-sm font-medium">Searching locations…</span>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <ul className="divide-y divide-border-subtle p-1">
          {suggestions.map((location, index) => (
            <li
              key={location.id}
              id={`${listboxId}-opt-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onPointerDown={event => {
                // Keep focus on the combobox and select immediately for mouse,
                // touch, and pen input (avoids the blur-before-click race).
                event.preventDefault()
                onSelect(location)
              }}
              onMouseEnter={() => onHighlightedIndexChange(index)}
              className={`flex cursor-pointer touch-manipulation items-center gap-3 rounded-xl px-3 py-3.5 transition-colors duration-fast ${
                index === highlightedIndex
                  ? 'bg-brand-primary-light text-text-primary dark:bg-brand-primary/15'
                  : 'hover:bg-surface-2'
              }`}
            >
              <div className="icon-container icon-container-sm icon-container-brand shrink-0">
                <Icon icon="MapPin" size={16} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-text-primary">
                  {location.name}
                </p>
                <p className="break-words text-xs text-text-tertiary">
                  {formatLocationName(location)}
                </p>
              </div>
              <div className="shrink-0 font-mono text-xs tabular-nums text-text-quaternary">
                {formatPopulation(location.population)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && suggestions.length === 0 && !error && (
        <div className="px-4 py-10 text-center">
          <div className="mx-auto mb-3 icon-container icon-container-xl icon-container-muted">
            <Icon icon="MapPin" size={28} className="text-text-quaternary" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No locations found</p>
          <p className="mt-1 text-sm text-text-tertiary">Try a different search term</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="px-4 py-6 text-center" role="alert">
          <div className="mx-auto mb-3 icon-container icon-container-lg icon-container-danger">
            <Icon icon="AlertCircle" size={22} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-semantic-danger">{error}</p>
          <p className="mt-1 text-xs text-text-tertiary">Please try again or check your connection</p>
        </div>
      )}
    </div>
  )
}

export const LocationSearch: FC<LocationSearchProps> = ({
  query,
  suggestions,
  isLoading,
  error,
  selectedLocation,
  onQueryChange,
  onSelect,
  onClear,
  placeholder = 'Search for a city or municipality…',
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const [isFocused, setIsFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [layout, setLayout] = useState<DropdownLayout | null>(null)

  const hasQuery = query.trim().length > 0
  const showDropdown = isFocused && hasQuery && !selectedLocation
  const activeIndex =
    highlightedIndex >= 0 && highlightedIndex < suggestions.length ? highlightedIndex : -1

  const updateDropdownLayout = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    const gutter = 8
    const gap = 8

    const anchorWidth = rect.width > 0 ? rect.width : 320
    const width = Math.min(anchorWidth, Math.max(viewportWidth - gutter * 2, 1))
    const left = Math.min(
      Math.max(rect.left, gutter),
      Math.max(gutter, viewportWidth - width - gutter)
    )

    const spaceBelow = viewportHeight - rect.bottom - gap - gutter
    const spaceAbove = rect.top - gap - gutter
    const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow
    const availableSpace = placeAbove ? spaceAbove : spaceBelow

    setLayout({
      top: placeAbove ? undefined : rect.bottom + gap,
      bottom: placeAbove ? Math.max(gutter, viewportHeight - rect.top + gap) : undefined,
      left,
      width,
      maxHeight: Math.max(96, Math.min(360, availableSpace)),
    })
  }, [])

  // Position before paint, then keep the fixed-position list in sync while the
  // page (or the mobile visual viewport/keyboard) scrolls and resizes.
  useLayoutEffect(() => {
    if (!showDropdown) return

    updateDropdownLayout()
    const visualViewport = window.visualViewport

    window.addEventListener('resize', updateDropdownLayout)
    window.addEventListener('scroll', updateDropdownLayout, true)
    visualViewport?.addEventListener('resize', updateDropdownLayout)
    visualViewport?.addEventListener('scroll', updateDropdownLayout)

    return () => {
      window.removeEventListener('resize', updateDropdownLayout)
      window.removeEventListener('scroll', updateDropdownLayout, true)
      visualViewport?.removeEventListener('resize', updateDropdownLayout)
      visualViewport?.removeEventListener('scroll', updateDropdownLayout)
    }
  }, [showDropdown, updateDropdownLayout])

  // Dismiss on an outside pointer press (works for mouse, touch, and pen).
  useEffect(() => {
    if (!showDropdown) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setIsFocused(false)
      setHighlightedIndex(-1)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [showDropdown])

  const handleQueryChange = (value: string) => {
    setHighlightedIndex(-1)
    // Typing implies intent to search again, even if an earlier outside
    // pointer press dismissed the list while the input kept focus.
    setIsFocused(true)
    onQueryChange(value)
  }

  const formatLocationName = (location: GeocodingResult): string => {
    const parts = [location.name]
    if (location.admin1) parts.push(location.admin1)
    if (location.country) parts.push(location.country)
    return parts.join(', ')
  }

  const formatPopulation = (population: number): string => {
    if (!population || population <= 0) return '—'
    if (population >= 1_000_000) return `${(population / 1_000_000).toFixed(1)}M`
    return `${Math.round(population / 1000)}k`
  }

  const handleSelect = useCallback((location: GeocodingResult) => {
    setHighlightedIndex(-1)
    setIsFocused(false)
    onSelect(location)
  }, [onSelect])

  const handleBlur = useCallback(() => {
    // Let pointer selection finish before deciding the field truly lost focus.
    window.setTimeout(() => {
      const activeElement = document.activeElement
      if (activeElement && dropdownRef.current?.contains(activeElement)) return
      setIsFocused(false)
      setHighlightedIndex(-1)
    }, 120)
  }, [])

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (showDropdown) {
        event.preventDefault()
        event.stopPropagation()
        setIsFocused(false)
        setHighlightedIndex(-1)
        return
      }
      onClear()
      inputRef.current?.blur()
      return
    }

    if (!showDropdown) {
      if (event.key === 'ArrowDown' && hasQuery) {
        event.preventDefault()
        setIsFocused(true)
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        if (!suggestions.length) return
        event.preventDefault()
        setHighlightedIndex(activeIndex < suggestions.length - 1 ? activeIndex + 1 : 0)
        break
      case 'ArrowUp':
        if (!suggestions.length) return
        event.preventDefault()
        setHighlightedIndex(activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1)
        break
      case 'Home':
        if (!suggestions.length) return
        event.preventDefault()
        setHighlightedIndex(0)
        break
      case 'End':
        if (!suggestions.length) return
        event.preventDefault()
        setHighlightedIndex(suggestions.length - 1)
        break
      case 'Enter':
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          event.preventDefault()
          handleSelect(suggestions[activeIndex])
        }
        break
    }
  }

  const dropdownContent = layout ? (
    <Dropdown
      listboxId={listboxId}
      suggestions={suggestions}
      isLoading={isLoading}
      error={error}
      highlightedIndex={activeIndex}
      onHighlightedIndexChange={setHighlightedIndex}
      onSelect={handleSelect}
      formatLocationName={formatLocationName}
      formatPopulation={formatPopulation}
      layout={layout}
      dropdownRef={dropdownRef}
    />
  ) : null

  return (
    <div ref={anchorRef} className="relative">
      <Input
        ref={inputRef}
        type="search"
        value={query}
        autoFocus
        onChange={e => handleQueryChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        leftIcon={<Icon icon="Search" size={18} aria-hidden="true" />}
        rightIcon={
          query ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClear}
              aria-label="Clear search"
              className="text-text-tertiary hover:text-text-primary"
            >
              <Icon icon="X" size={15} aria-hidden="true" />
            </Button>
          ) : undefined
        }
        error={error && !showDropdown ? error : undefined}
        fullWidth
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showDropdown}
        aria-activedescendant={
          showDropdown && activeIndex >= 0
            ? `${listboxId}-opt-${activeIndex}`
            : undefined
        }
        role="combobox"
      />

      {showDropdown && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : null}

      {selectedLocation && (
        <div className="mt-3 animate-slide-up card-interactive border-l-4 border-semantic-success bg-semantic-success-soft p-4">
          <div className="flex items-center gap-3">
            <div className="icon-container icon-container-sm icon-container-success shrink-0">
              <Icon icon="CheckCircle" size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium text-text-primary">
                Selected: {selectedLocation.name}
              </p>
              <p className="break-words text-xs text-text-tertiary">
                {formatLocationName(selectedLocation)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClear}
              aria-label="Clear selected location"
              className="text-text-tertiary hover:text-text-primary"
            >
              <Icon icon="X" size={15} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
