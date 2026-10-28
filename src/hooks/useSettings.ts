/**
 * Hook for managing user settings with localStorage persistence
 *
 * Settings are loaded synchronously (lazily) on first render so the app
 * never flashes default values.
 */

import { useState, useCallback } from 'react'
import { getSettings, saveSettings } from '../services/storage'
import type { UserSettings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../types/settings'

type Settings = UserSettings

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(getSettings)

  // Save settings to localStorage when they change
  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      saveSettings(updated)
      return updated
    })
  }, [])

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('weather-advisory-settings')
  }, [])

  // Toggle specific settings
  const toggleSetting = useCallback(<K extends keyof Settings>(key: K, value?: Settings[K]) => {
    setSettings(prev => {
      const newValue = value !== undefined ? value : !prev[key] as Settings[K]
      const updated = { ...prev, [key]: newValue }
      saveSettings(updated)
      return updated
    })
  }, [])

  return {
    settings,
    updateSettings,
    resetSettings,
    toggleSetting,
  }
}
