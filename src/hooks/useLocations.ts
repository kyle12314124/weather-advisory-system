/**
 * Hook for managing saved/favorite locations with localStorage persistence
 *
 * Locations are loaded synchronously (lazily) on first render.
 */

import { useState, useCallback } from 'react'
import {
  getSavedLocations,
  saveLocation,
  removeLocation,
  clearLocations,
  getLastLocation,
  saveLastLocation,
  geocodingResultToSavedLocation,
} from '../services/storage'
import type { SavedLocation, GeocodingResult } from '../types/location'

export function useLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>(getSavedLocations)
  const [lastLocation, setLastLocation] = useState<SavedLocation | null>(getLastLocation)

  // Add or update a location
  const addLocation = useCallback((location: GeocodingResult | Omit<SavedLocation, 'id' | 'addedAt'>) => {
    let locationToSave: Omit<SavedLocation, 'id' | 'addedAt'>

    if ('feature_code' in location) {
      // It's a GeocodingResult
      locationToSave = geocodingResultToSavedLocation(location)
    } else {
      // It's already a SavedLocation without id/addedAt
      locationToSave = location
    }

    const saved = saveLocation(locationToSave)
    setLocations(prev => {
      const exists = prev.findIndex(l => l.id === saved.id)
      if (exists >= 0) {
        const updated = [...prev]
        updated[exists] = saved
        return updated
      }
      return [saved, ...prev.slice(0, 9)] // Keep max 10
    })
    return saved
  }, [])

  // Remove a location by ID
  const deleteLocation = useCallback((id: string) => {
    removeLocation(id)
    setLocations(prev => prev.filter(l => l.id !== id))
    // If this was the last selected location, clear it
    setLastLocation(prev => prev?.id === id ? null : prev)
  }, [])

  // Set the last selected location
  const selectLocation = useCallback((location: SavedLocation) => {
    saveLastLocation(location)
    setLastLocation(location)
  }, [])

  // Clear all locations
  const clearAllLocations = useCallback(() => {
    clearLocations()
    setLocations([])
    setLastLocation(null)
  }, [])

  // Check if a location is already saved (by coordinates)
  const isLocationSaved = useCallback((latitude: number, longitude: number) => {
    return locations.some(
      loc => Math.abs(loc.latitude - latitude) < 0.001 &&
             Math.abs(loc.longitude - longitude) < 0.001
    )
  }, [locations])

  // Get a saved location by ID
  const getLocationById = useCallback((id: string) => {
    return locations.find(l => l.id === id)
  }, [locations])

  return {
    locations,
    lastLocation,
    addLocation,
    deleteLocation,
    selectLocation,
    clearAllLocations,
    isLocationSaved,
    getLocationById,
  }
}
