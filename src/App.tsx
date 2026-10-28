/**
 * Weather Advisory System - Main Application Component
 * Premium redesign with refined layout, visual polish, and full responsiveness.
 */

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { Icon } from './components/Icon'
import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  AdvisoryPanel,
  LocationSearch,
  FavoritesPanel,
  SettingsPanel,
  LoadingState,
  ErrorState,
  EmptyState,
  OfflineState,
  OfflineBanner,
  WeatherSkeleton,
  ErrorBoundary,
} from './components'
import { useSettings } from './hooks/useSettings'
import { useLocations } from './hooks/useLocations'
import { useGeocoding } from './hooks/useGeocoding'
import { useWeather } from './hooks/useWeather'
import { useAdvisory } from './hooks/useAdvisory'
import type { GeocodingResult, SavedLocation } from './types/location'

// Default location (Manila, Philippines)
const DEFAULT_LATITUDE = 14.5995
const DEFAULT_LONGITUDE = 120.9842
const DEFAULT_TIMEZONE = 'Asia/Manila'
const DEFAULT_LOCATION_NAME = 'Manila, Philippines'

const TABS = [
  { id: 'forecast', label: 'Forecast', icon: 'Calendar' },
  { id: 'charts', label: 'Charts', icon: 'BarChart' },
  { id: 'advisories', label: 'Advisories', icon: 'AlertTriangle' },
  { id: 'favorites', label: 'Favorites', icon: 'Star' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
] as const

type TabId = (typeof TABS)[number]['id']

// Charts pull in the heavy recharts bundle - load them on demand
const WeatherCharts = lazy(() =>
  import('./components/WeatherCharts').then(module => ({ default: module.WeatherCharts }))
)

function App() {
  // Settings and locations
  const {
    settings,
    updateSettings,
    resetSettings,
  } = useSettings()
  const { locations, lastLocation, addLocation, deleteLocation, selectLocation, clearAllLocations } = useLocations()

  // Geocoding
  const {
    query,
    suggestions,
    isLoading: isSearching,
    error: searchError,
    selectedLocation: geocodingSelected,
    search,
    clear: clearSearch,
    select: selectGeocoding,
  } = useGeocoding()

  // Determine initial location
  const initialLocation = useMemo(() => {
    if (lastLocation) return lastLocation
    return {
      latitude: DEFAULT_LATITUDE,
      longitude: DEFAULT_LONGITUDE,
      timezone: DEFAULT_TIMEZONE,
      name: DEFAULT_LOCATION_NAME,
    }
  }, [lastLocation])

  // Weather data
  const {
    current,
    hourly,
    daily,
    location: weatherLocation,
    isLoading: isWeatherLoading,
    error: weatherError,
    lastUpdated,
    refresh,
  } = useWeather({
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    timezone: initialLocation.timezone,
    enabled: true,
    autoRefresh: settings.autoRefresh,
    refreshInterval: settings.refreshInterval,
  })

  // Advisories
  const {
    advisories,
    highestSeverity,
    hasCriticalAdvisories,
    pagasaUrl,
    disclaimer,
  } = useAdvisory(current, hourly, daily)

  // UI State
  const [activeTab, setActiveTab] = useState<TabId>('forecast')
  const [showSearch, setShowSearch] = useState(false)
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine)
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Track system color-scheme preference (for theme: 'system')
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme to <html> and keep the browser UI color in sync.
  // useLayoutEffect runs before paint so switching themes never flashes.
  const isDarkTheme = settings.theme === 'dark' || (settings.theme === 'system' && systemPrefersDark)
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDarkTheme ? '#08101a' : '#f7f9fc')
  }, [isDarkTheme])

  // Display name for the current location.
  const locationName = weatherLocation?.name || lastLocation?.name || initialLocation.name

  // Lock body scroll while the search dialog is open
  useEffect(() => {
    if (!showSearch) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showSearch])

  // Handle location selection from search
  const handleLocationSelect = useCallback((location: GeocodingResult) => {
    selectGeocoding(location)
    const saved = addLocation(location)
    selectLocation(saved)
    setShowSearch(false)
  }, [selectGeocoding, addLocation, selectLocation])

  // Handle saved location selection
  const handleSavedLocationSelect = useCallback((location: SavedLocation) => {
    selectLocation(location)
    clearSearch()
    setShowSearch(false)
  }, [selectLocation, clearSearch])

  // Handle location removal
  const handleLocationRemove = useCallback((id: string) => {
    deleteLocation(id)
  }, [deleteLocation])

  // Handle clear all locations
  const handleClearAllLocations = useCallback(() => {
    if (window.confirm('Remove all saved locations?')) {
      clearAllLocations()
    }
  }, [clearAllLocations])

  // Handle device geolocation (used by the Settings toggle).
  // Returns an error message, or null on success.
  const handleGeolocation = useCallback(async (): Promise<string | null> => {
    if (!('geolocation' in navigator)) {
      return 'Geolocation is not supported by this browser.'
    }
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      const { latitude, longitude } = position.coords
      const saved = addLocation({
        name: 'My Location',
        latitude,
        longitude,
        timezone: DEFAULT_TIMEZONE,
        country: '',
      })
      selectLocation(saved)
      clearSearch()
      return null
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          return 'Location permission denied. Enable it in your browser settings and try again.'
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          return 'Location information is currently unavailable.'
        }
        if (error.code === error.TIMEOUT) {
          return 'Location request timed out. Please try again.'
        }
      }
      return 'Failed to detect your location. Please try again.'
    }
  }, [addLocation, selectLocation, clearSearch])

  // Keyboard navigation for the tab strip
  const handleTabKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = TABS.findIndex(tab => tab.id === activeTab)
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = TABS.length - 1

    if (nextIndex !== null) {
      event.preventDefault()
      setActiveTab(TABS[nextIndex].id)
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus()
    }
  }, [activeTab])

  // Show full-screen offline state only on initial load with no cached data
  if (!isOnline && !current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0 p-4">
        <OfflineState onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Inline offline banner (shows when offline but cached data exists) */}
      {!isOnline && current && (
        <OfflineBanner onRetry={refresh} lastUpdated={lastUpdated} use24Hour={settings.use24Hour} />
      )}

      {/* Header - responsive, glassmorphism */}
      <header className="sticky top-0 z-sticky border-b border-border-subtle bg-surface-0/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
            {/* Brand */}
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 lg:gap-4">
              <div className="icon-container icon-container-md icon-container-brand shrink-0">
                <Icon icon="CloudSun" size={22} aria-hidden="true" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <h1 className="truncate text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                  Weather Advisory
                </h1>
                <p className="truncate text-xs text-text-tertiary">Philippine Weather Dashboard</p>
              </div>
            </div>

            {/* Actions — search bar + refresh + theme */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* Location search bar */}
              <div className="relative hidden sm:block" style={{ width: '200px' }}>
                <label htmlFor="location-search" className="sr-only">Search location</label>
                <div className="relative">
                  <input
                    id="location-search"
                    type="search"
                    readOnly
                    value={locationName}
                    onClick={() => {
                      clearSearch()
                      setShowSearch(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        clearSearch()
                        setShowSearch(true)
                      }
                    }}
                    className="w-full h-9 pl-9 pr-9 text-sm font-medium text-text-primary bg-surface-1 border border-border-subtle rounded-xl placeholder-text-quaternary transition-all duration-fast hover:border-border-default hover:bg-surface-2 hover:shadow-md focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2 focus:ring-offset-surface-0 dark:focus:ring-offset-surface-0"
                    placeholder="Search location…"
                    aria-label="Search location"
                    aria-haspopup="dialog"
                    aria-expanded={showSearch}
                  />
                  <Icon
                    icon="Search"
                    size={15}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors duration-fast pointer-events-none"
                    aria-hidden="true"
                  />
                  <Icon
                    icon="MapPin"
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-primary/70 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={refresh}
                disabled={isWeatherLoading}
                className="btn btn-secondary btn-icon"
                aria-label="Refresh weather data"
              >
                <Icon icon="RefreshCw" size={18} className={isWeatherLoading ? 'animate-spin' : ''} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ theme: isDarkTheme ? 'light' : 'dark' })}
                className="btn btn-secondary btn-icon"
                aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
              >
                <Icon icon={isDarkTheme ? 'Sun' : 'Moon'} size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Search Dialog - full screen on mobile, centered on desktop */}
        {showSearch && (
          <div
            className="fixed inset-0 z-modal flex items-start justify-center bg-overlay p-2 pt-[10vh] sm:p-4 sm:pt-20 lg:items-center lg:pt-16 animate-fade-in"
            onClick={() => setShowSearch(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Change location"
          >
            <div
              className="animate-scale-in w-full max-w-lg overflow-hidden rounded-3xl border border-border-default bg-surface-1 shadow-2xl card-glass lg:max-w-md"
              onClick={event => event.stopPropagation()}
              onKeyDown={event => {
                if (event.key === 'Escape') setShowSearch(false)
              }}
            >
              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-5">
                <h2 className="text-lg font-semibold text-text-primary sm:text-xl">Change Location</h2>
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className="btn btn-ghost btn-icon-sm text-text-tertiary hover:text-text-primary"
                  aria-label="Close search"
                >
                  <Icon icon="X" size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="p-4 sm:p-5 max-h-[75vh] overflow-auto">
                <LocationSearch
                  query={query}
                  suggestions={suggestions}
                  isLoading={isSearching}
                  error={searchError}
                  selectedLocation={geocodingSelected}
                  onQueryChange={search}
                  onSelect={handleLocationSelect}
                  onClear={clearSearch}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton (first load) */}
        {isWeatherLoading && !current && !weatherError && (
          <WeatherSkeleton />
        )}

        {/* Error state (no data at all) */}
        {weatherError && !current && (
          <ErrorState
            message={weatherError}
            onRetry={refresh}
          />
        )}

        {/* Weather Content */}
        {current ? (
          <ErrorBoundary
            fallback={
              <ErrorState
                message="A display error occurred. Please try refreshing the page."
                onRetry={refresh}
                retryLabel="Refresh Weather"
              />
            }
          >
            <div className="space-y-5 sm:space-y-6 lg:space-y-7">
              {/* Current Weather Hero */}
              <CurrentWeather
                current={current}
                temperatureUnit={settings.temperatureUnit}
                windSpeedUnit={settings.windSpeedUnit}
                precipitationUnit={settings.precipitationUnit}
                showUVIndex={settings.showUVIndex}
                locationName={locationName}
                lastUpdated={lastUpdated}
                use24Hour={settings.use24Hour}
                timezone={initialLocation.timezone}
              />

              {/* Tab Navigation - responsive */}
              <div
                className="scrollbar-none -mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0"
                onKeyDown={handleTabKeyDown}
              >
                <div
                  className="tabs-list"
                  role="tablist"
                  aria-label="Weather sections"
                >
                  {TABS.map(tab => {
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        id={`tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${tab.id}`}
                        data-state={isActive ? 'active' : 'inactive'}
                        tabIndex={isActive ? 0 : -1}
                        className="tabs-trigger"
                      >
                        <Icon icon={tab.icon} size={14} aria-hidden="true" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.id === 'advisories' && hasCriticalAdvisories && (
                          <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-semantic-danger animate-pulse" aria-hidden="true" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tab Panels */}
              <div
                id={`panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeTab}`}
                tabIndex={-1}
                className="animate-fade-in"
              >
                {activeTab === 'forecast' && (
                  <div className="space-y-5 sm:space-y-6">
                    {hourly.length > 0 && (
                      <HourlyForecast
                        hourly={hourly}
                        temperatureUnit={settings.temperatureUnit}
                        windSpeedUnit={settings.windSpeedUnit}
                        use24Hour={settings.use24Hour}
                        timezone={initialLocation.timezone}
                      />
                    )}
                    {daily.length > 0 && (
                      <DailyForecast
                        daily={daily}
                        temperatureUnit={settings.temperatureUnit}
                        windSpeedUnit={settings.windSpeedUnit}
                        use24Hour={settings.use24Hour}
                        timezone={initialLocation.timezone}
                      />
                    )}
                    {(!hourly.length || !daily.length) && !isWeatherLoading && (
                      <EmptyState
                        title="No forecast data available"
                        message="Unable to load forecast data for this location."
                        action={{ label: 'Refresh', onClick: refresh }}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'charts' && (
                  <Suspense fallback={<LoadingState message="Loading charts…" size="md" />}>
                    <WeatherCharts
                      hourly={hourly}
                      daily={daily}
                      temperatureUnit={settings.temperatureUnit}
                      precipitationUnit={settings.precipitationUnit}
                      use24Hour={settings.use24Hour}
                      timezone={initialLocation.timezone}
                    />
                  </Suspense>
                )}

                {activeTab === 'advisories' && (
                  <AdvisoryPanel
                    advisories={advisories}
                    highestSeverity={highestSeverity}
                    hasCriticalAdvisories={hasCriticalAdvisories}
                    pagasaUrl={pagasaUrl}
                    disclaimer={disclaimer}
                  />
                )}

                {activeTab === 'favorites' && (
                  <FavoritesPanel
                    locations={locations}
                    currentLocationId={lastLocation?.id || null}
                    onSelect={handleSavedLocationSelect}
                    onRemove={handleLocationRemove}
                    onClearAll={handleClearAllLocations}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsPanel
                    settings={settings}
                    onUpdate={updateSettings}
                    onReset={resetSettings}
                    isStorageAvailable={typeof localStorage !== 'undefined'}
                    onRequestGeolocation={handleGeolocation}
                  />
                )}
              </div>
            </div>
          </ErrorBoundary>
        ) : null}

        {/* Footer Attribution */}
        <footer className="mt-10 border-t border-border-subtle pt-6 sm:mt-12 sm:pt-8">
          <div className="flex flex-col items-center justify-between gap-2 text-sm text-text-tertiary sm:flex-row">
            <p>
              Weather data by{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-primary underline-offset-2 hover:underline"
              >
                Open-Meteo
              </a>
            </p>
            <p>
              For official Philippine weather information, visit{' '}
              <a
                href={pagasaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-primary underline-offset-2 hover:underline"
              >
                PAGASA
              </a>
            </p>
            <p className="text-center sm:text-right">
              Weather Advisory System
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App