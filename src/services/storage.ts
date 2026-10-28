/**
 * LocalStorage utilities for saved locations and user preferences
 */

import type { UserSettings } from '../types/settings'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, LOCATIONS_STORAGE_KEY, LAST_LOCATION_STORAGE_KEY } from '../types/settings'
import type { SavedLocation, GeocodingResult } from '../types/location'

// Settings storage
export function getSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle new settings
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.error('Failed to parse settings:', error)
  }
  return DEFAULT_SETTINGS
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export function resetSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to reset settings:', error)
  }
}

// Saved locations storage
export function getSavedLocations(): SavedLocation[] {
  try {
    const stored = localStorage.getItem(LOCATIONS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to parse saved locations:', error)
  }
  return []
}

export function saveLocation(location: Omit<SavedLocation, 'id' | 'addedAt'>): SavedLocation {
  const locations = getSavedLocations()

  // Check if location already exists (by coordinates)
  const existingIndex = locations.findIndex(
    loc => Math.abs(loc.latitude - location.latitude) < 0.001 &&
           Math.abs(loc.longitude - location.longitude) < 0.001
  )

  const newLocation: SavedLocation = {
    ...location,
    id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    addedAt: Date.now(),
  }

  if (existingIndex >= 0) {
    locations[existingIndex] = { ...locations[existingIndex], ...newLocation, id: locations[existingIndex].id, addedAt: locations[existingIndex].addedAt }
  } else {
    locations.unshift(newLocation)
  }

  // Keep only last 10 locations
  const trimmed = locations.slice(0, 10)

  try {
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Failed to save location:', error)
  }

  return newLocation
}

export function removeLocation(id: string): void {
  const locations = getSavedLocations().filter(loc => loc.id !== id)
  try {
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations))
  } catch (error) {
    console.error('Failed to remove location:', error)
  }
}

export function clearLocations(): void {
  try {
    localStorage.removeItem(LOCATIONS_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear locations:', error)
  }
}

// Convert GeocodingResult to SavedLocation
export function geocodingResultToSavedLocation(result: GeocodingResult): Omit<SavedLocation, 'id' | 'addedAt'> {
  return {
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
    country: result.country,
    admin1: result.admin1,
    admin2: result.admin2,
  }
}

// Last selected location storage
export function getLastLocation(): SavedLocation | null {
  try {
    const stored = localStorage.getItem(LAST_LOCATION_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to parse last location:', error)
  }
  return null
}

export function saveLastLocation(location: SavedLocation): void {
  try {
    localStorage.setItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify(location))
  } catch (error) {
    console.error('Failed to save last location:', error)
  }
}

// Utility to check if localStorage is available
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}