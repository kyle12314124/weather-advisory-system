/**
 * Settings Panel Component - Premium Redesign
 * Manages user preferences: units, theme, time format, and data options.
 * Beautiful, responsive layout with polished interactions.
 */

import { type FC, useState } from 'react'
import { Icon } from './Icon'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card'
import { Button } from './Button'
import { Input } from './Input'
import type { UserSettings, TemperatureUnit, WindSpeedUnit, PrecipitationUnit } from '../types/settings'

interface SettingsPanelProps {
  settings: UserSettings
  onUpdate: (settings: Partial<UserSettings>) => void
  onReset: () => void
  isStorageAvailable: boolean
  onRequestGeolocation?: () => Promise<string | null>
}

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

const Toggle: FC<ToggleProps> = ({ label, checked, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className="toggle"
  >
    <span aria-hidden="true" />
  </button>
)

const selectClasses = 'select-field'

export const SettingsPanel: FC<SettingsPanelProps> = ({
  settings,
  onUpdate,
  onReset,
  isStorageAvailable,
  onRequestGeolocation,
}) => {
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'error'>('idle')
  const [geoError, setGeoError] = useState<string | null>(null)

  const handleUnitChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    onUpdate({ [key]: value })
  }

  const handleGeolocationToggle = async (checked: boolean) => {
    if (!checked) {
      setGeoStatus('idle')
      setGeoError(null)
      onUpdate({ useGeolocation: false })
      return
    }

    if (!onRequestGeolocation) {
      onUpdate({ useGeolocation: true })
      return
    }

    setGeoStatus('locating')
    setGeoError(null)
    const errorMessage = await onRequestGeolocation()
    if (errorMessage) {
      setGeoStatus('error')
      setGeoError(errorMessage)
      onUpdate({ useGeolocation: false })
    } else {
      setGeoStatus('idle')
      onUpdate({ useGeolocation: true })
    }
  }

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: 'Sun' },
    { value: 'dark' as const, label: 'Dark', icon: 'Moon' },
    { value: 'system' as const, label: 'System', icon: 'Monitor' },
  ]

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 w-full sm:w-auto">
          <CardTitle size="lg">Settings</CardTitle>
          <CardDescription>Customize units, appearance, and data preferences</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          leftIcon={<Icon icon="RotateCcw" size={14} aria-hidden="true" />}
          aria-label="Reset to defaults"
          className="max-sm:min-h-11"
        >
          <span>Reset to defaults</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Units Section */}
        <section aria-labelledby="units-heading">
          <h3 id="units-heading" className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4">
            Units
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="input-wrapper">
              <label htmlFor="temp-unit" className="input-label">Temperature</label>
              <select
                id="temp-unit"
                value={settings.temperatureUnit}
                onChange={e => handleUnitChange('temperatureUnit', e.target.value as TemperatureUnit)}
                className={selectClasses}
              >
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>

            <div className="input-wrapper">
              <label htmlFor="wind-unit" className="input-label">Wind Speed</label>
              <select
                id="wind-unit"
                value={settings.windSpeedUnit}
                onChange={e => handleUnitChange('windSpeedUnit', e.target.value as WindSpeedUnit)}
                className={selectClasses}
              >
                <option value="kmh">km/h</option>
                <option value="ms">m/s</option>
                <option value="mph">mph</option>
              </select>
            </div>

            <div className="input-wrapper">
              <label htmlFor="precip-unit" className="input-label">Precipitation</label>
              <select
                id="precip-unit"
                value={settings.precipitationUnit}
                onChange={e => handleUnitChange('precipitationUnit', e.target.value as PrecipitationUnit)}
                className={selectClasses}
              >
                <option value="mm">Millimeters (mm)</option>
                <option value="inch">Inches (in)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Display Section */}
        <section aria-labelledby="display-heading">
          <h3 id="display-heading" className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4">
            Display
          </h3>
          <div className="space-y-5">
            {/* Theme */}
            <div className="card-filled p-4 rounded-xl">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-sm font-medium text-text-primary break-words">Theme</p>
                  <p className="text-sm text-text-tertiary">Choose light, dark, or follow your system</p>
                </div>
                <div
                  className="inline-flex w-full rounded-lg border border-border-default bg-surface-2 p-1 sm:w-auto"
                  role="radiogroup"
                  aria-label="Theme"
                >
                  {themeOptions.map(theme => (
                    <button
                      key={theme.value}
                      type="button"
                      role="radio"
                      aria-checked={settings.theme === theme.value}
                      aria-label={`${theme.label} theme`}
                      onClick={() => handleUnitChange('theme', theme.value)}
                      className={`inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2 sm:h-9 sm:flex-none sm:gap-2 sm:px-3 sm:text-sm ${
                        settings.theme === theme.value
                          ? 'bg-surface-1 text-text-primary shadow-sm ring-1 ring-border-default'
                          : 'text-text-tertiary hover:bg-surface-3 hover:text-text-primary'
                      }`}>
                      <Icon icon={theme.icon} size={14} aria-hidden="true" />
                      <span>{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Format */}
            <div className="card-filled p-4 rounded-xl">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-sm font-medium text-text-primary break-words">24-Hour Time</p>
                  <p className="text-sm text-text-tertiary">Use 24-hour format for time display</p>
                </div>
                <Toggle
                  label="24-hour time format"
                  checked={settings.use24Hour}
                  onChange={checked => handleUnitChange('use24Hour', checked)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section aria-labelledby="data-heading">
          <h3 id="data-heading" className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4">
            Data & Refresh
          </h3>
          <div className="space-y-5">
            {/* Show UV Index */}
            <div className="card-filled p-4 rounded-xl">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-sm font-medium text-text-primary break-words">UV Index</p>
                  <p className="text-sm text-text-tertiary">Display UV index in current weather</p>
                </div>
                <Toggle
                  label="Show UV index"
                  checked={settings.showUVIndex}
                  onChange={checked => handleUnitChange('showUVIndex', checked)}
                />
              </div>
            </div>

            {/* Auto Refresh */}
            <div className="card-filled p-4 rounded-xl">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-sm font-medium text-text-primary break-words">Auto Refresh</p>
                  <p className="text-sm text-text-tertiary">Automatically update weather data in the background</p>
                </div>
                <Toggle
                  label="Auto refresh"
                  checked={settings.autoRefresh}
                  onChange={checked => handleUnitChange('autoRefresh', checked)}
                />
              </div>
            </div>

            {/* Refresh Interval */}
            {settings.autoRefresh && (
              <div className="input-wrapper animate-slide-up">
                <Input
                  id="refresh-interval"
                  type="number"
                  label="Refresh Interval (minutes)"
                  value={settings.refreshInterval}
                  onChange={e => {
                    const value = parseInt(e.target.value, 10)
                    const clamped = Number.isNaN(value) ? 5 : Math.max(5, Math.min(120, value))
                    handleUnitChange('refreshInterval', clamped)
                  }}
                  className="max-w-[160px]"
                  min={5}
                  max={120}
                  step={5}
                  hint="Between 5 and 120 minutes"
                />
              </div>
            )}
          </div>
        </section>

        {/* Location Section */}
        <section aria-labelledby="location-heading">
          <h3 id="location-heading" className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4">
            Location
          </h3>
          <div className="space-y-4">
            <div className="card-filled p-4 rounded-xl">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-sm font-medium text-text-primary break-words">Use Device Location</p>
                  <p className="text-sm text-text-tertiary">Detect your location once using the browser</p>
                </div>
                <Toggle
                  label="Use device location"
                  checked={settings.useGeolocation}
                  onChange={handleGeolocationToggle}
                  disabled={geoStatus === 'locating'}
                />
              </div>

              {geoStatus === 'locating' && (
                <p className="flex items-center gap-2 text-sm text-text-tertiary" role="status">
                  <Icon icon="Loader" size={14} className="animate-spin text-brand-primary" aria-hidden="true" />
                  Detecting your location…
                </p>
              )}

              {geoError && (
                <div className="flex items-start gap-3 rounded-lg border border-semantic-danger bg-semantic-danger-soft p-3" role="alert">
                  <Icon icon="AlertCircle" size={16} className="mt-0.5 shrink-0 text-semantic-danger" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-semantic-danger">Location Error</p>
                    <p className="mt-0.5 text-sm text-text-secondary">{geoError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Storage Status */}
        {!isStorageAvailable && (
          <div className="flex items-start gap-3 rounded-xl border border-semantic-warning bg-semantic-warning-soft p-4">
            <Icon icon="AlertTriangle" size={20} className="mt-0.5 shrink-0 text-semantic-warning" aria-hidden="true" />
            <div>
              <p className="font-medium text-text-primary">Storage Unavailable</p>
              <p className="mt-0.5 text-sm text-text-secondary">
                Your browser doesn't support localStorage. Settings and favorites won't persist.
              </p>
            </div>
          </div>
        )}

        {/* Attribution */}
        <div className="border-t border-border-subtle pt-5">
          <p className="text-center text-xs text-text-tertiary">
            Weather data provided by{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              Open-Meteo
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}