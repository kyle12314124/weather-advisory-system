/**
 * Location-related TypeScript types
 * Based on Open-Meteo Geocoding API response structure
 */

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  feature_code: string;
  country_code: string;
  admin1_id?: number;
  admin2_id?: number;
  admin3_id?: number;
  admin4_id?: number;
  timezone: string;
  population: number;
  country_id: number;
  country: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
}

export interface GeocodingResponse {
  results: GeocodingResult[];
  generationtime_ms: number;
}

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
  admin1?: string;
  admin2?: string;
  addedAt: number;
  isDefault?: boolean;
}

export interface LocationSearchState {
  query: string;
  suggestions: GeocodingResult[];
  isLoading: boolean;
  error: string | null;
  selectedLocation: GeocodingResult | null;
}