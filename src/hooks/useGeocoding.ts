/**
 * Hook for location search using Open-Meteo Geocoding API
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { searchLocations } from '../api/openMeteo'
import type { GeocodingResult } from '../types/location'

// Minimum query length before triggering a search
const MIN_SEARCH_LENGTH = 2

export function useGeocoding() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null)

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)
  // Track the query ID to prevent stale responses from overwriting newer results
  const queryIdRef = useRef(0)

  // Search function with debouncing
  const search = useCallback(async (searchQuery: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Update query immediately for responsive input. A new query invalidates
    // any previously selected location, otherwise the list stays hidden.
    setQuery(searchQuery)
    setSelectedLocation(null)

    // Clear suggestions if query is too short (but keep error state for empty query)
    if (!searchQuery.trim() || searchQuery.trim().length < MIN_SEARCH_LENGTH) {
      setSuggestions([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Increment query ID to mark this search as the latest
    const currentQueryId = ++queryIdRef.current

    // Debounce the actual search
    debounceRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController()

      try {
        const results = await searchLocations(searchQuery, abortControllerRef.current.signal)

        // Only update state if this is still the latest query
        if (currentQueryId === queryIdRef.current) {
          setSuggestions(results)
          // No results is a normal state, not an error - the UI handles it
        }
        // If queryId has changed, a newer search has started - discard these results
      } catch (err) {
        // Only set error if this is still the latest query and not an abort
        if (currentQueryId === queryIdRef.current && err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
          setSuggestions([])
        }
      } finally {
        if (currentQueryId === queryIdRef.current) {
          setIsLoading(false)
        }
      }
    }, 300)
  }, [])

  // Clear suggestions
  const clear = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setSelectedLocation(null)
    setError(null)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    // Increment queryId to invalidate any in-flight requests
    queryIdRef.current++
  }, [])

  // Select a location from suggestions
  const select = useCallback((location: GeocodingResult) => {
    setSelectedLocation(location)
    setQuery(location.name)
    setSuggestions([])
    setError(null)
    // Increment queryId to invalidate any pending search for the old query
    queryIdRef.current++
  }, [])

  // Update query without searching (for controlled input)
  const setQueryOnly = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    query,
    suggestions,
    isLoading,
    error,
    selectedLocation,
    search,
    clear,
    select,
    setQuery: setQueryOnly,
  }
}