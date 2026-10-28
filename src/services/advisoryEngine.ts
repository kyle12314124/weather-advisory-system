/**
 * Weather Advisory Engine
 * Generates weather-based recommendations from forecast data
 *
 * IMPORTANT: These are application-generated recommendations based on forecast data.
 * They are NOT official weather warnings or alerts from meteorological agencies.
 * For official Philippine weather information, visit: https://www.pagasa.dost.gov.ph/
 */

import type { ProcessedHourlyData, ProcessedDailyData } from '../types/weather'

export type AdvisorySeverity = 'info' | 'warning' | 'danger'

export interface WeatherAdvisory {
  id: string
  severity: AdvisorySeverity
  category: string
  title: string
  explanation: string
  recommendedAction: string
  observationTime: Date
  forecastTime?: Date
  source: 'current' | 'hourly' | 'daily'
}

/**
 * Advisory thresholds (documented assumptions)
 *
 * Temperature thresholds:
 * - Heat caution: >= 32°C (90°F) - increased risk of heat exhaustion
 * - Heat danger: >= 40°C (104°F) - high risk of heat stroke
 *
 * Wind thresholds:
 * - Windy: >= 20 km/h (12 mph) - Beaufort 4
 * - Strong wind: >= 40 km/h (25 mph) - Beaufort 6
 * - Gale: >= 60 km/h (37 mph) - Beaufort 7
 *
 * UV Index thresholds (WHO standard):
 * - Moderate: 3-5
 * - High: 6-7
 * - Very High: 8-10
 * - Extreme: 11+
 *
 * Precipitation probability:
 * - Moderate chance: >= 50%
 * - High chance: >= 80%
 *
 * Precipitation intensity (from weather codes):
 * - Light: drizzle, slight rain/snow
 * - Moderate: moderate rain/snow
 * - Heavy: heavy rain/snow, violent showers
 * - Thunderstorm: any thunderstorm code
 */

/**
 * Check if temperature warrants heat advisory
 */
function checkHeatAdvisory(
  temp: number,
  feelsLike: number,
  humidity: number,
  time: Date,
  source: 'current' | 'hourly' | 'daily'
): WeatherAdvisory[] {
  const advisories: WeatherAdvisory[] = []
  const effectiveTemp = Math.max(temp, feelsLike) // Use feels-like if higher

  if (effectiveTemp >= 40) {
    advisories.push({
      id: `heat-danger-${time.getTime()}`,
      severity: 'danger',
      category: 'Heat',
      title: 'Extreme Heat Danger',
      explanation: `Temperature feels like ${Math.round(effectiveTemp)}°C. High risk of heat stroke and heat exhaustion.`,
      recommendedAction: 'Avoid outdoor activities. Stay in air-conditioned spaces. Drink plenty of water. Check on vulnerable individuals.',
      observationTime: time,
      source,
    })
  } else if (effectiveTemp >= 35) {
    advisories.push({
      id: `heat-warning-${time.getTime()}`,
      severity: 'warning',
      category: 'Heat',
      title: 'Heat Warning',
      explanation: `Temperature feels like ${Math.round(effectiveTemp)}°C. Increased risk of heat-related illness.`,
      recommendedAction: 'Limit strenuous outdoor activities. Stay hydrated. Seek shade. Wear light clothing.',
      observationTime: time,
      source,
    })
  } else if (effectiveTemp >= 32 && humidity >= 70) {
    advisories.push({
      id: `heat-caution-${time.getTime()}`,
      severity: 'info',
      category: 'Heat',
      title: 'Heat Caution',
      explanation: `Temperature feels like ${Math.round(effectiveTemp)}°C with ${humidity}% humidity. Heat index is elevated.`,
      recommendedAction: 'Take breaks in shade if outdoors. Drink water regularly. Monitor for heat exhaustion symptoms.',
      observationTime: time,
      source,
    })
  }

  return advisories
}

/**
 * Check for cold temperature advisories
 */
function checkColdAdvisory(
  temp: number,
  feelsLike: number,
  windSpeed: number, // m/s
  time: Date,
  source: 'current' | 'hourly' | 'daily'
): WeatherAdvisory[] {
  const advisories: WeatherAdvisory[] = []
  const effectiveTemp = Math.min(temp, feelsLike) // Use feels-like if lower (wind chill)

  if (effectiveTemp <= -10) {
    advisories.push({
      id: `cold-danger-${time.getTime()}`,
      severity: 'danger',
      category: 'Cold',
      title: 'Extreme Cold Danger',
      explanation: `Feels like ${Math.round(effectiveTemp)}°C. Risk of frostbite and hypothermia.`,
      recommendedAction: 'Minimize time outdoors. Cover all exposed skin. Wear layers. Seek shelter immediately if shivering uncontrollably.',
      observationTime: time,
      source,
    })
  } else if (effectiveTemp <= 0) {
    advisories.push({
      id: `cold-warning-${time.getTime()}`,
      severity: 'warning',
      category: 'Cold',
      title: 'Freezing Conditions',
      explanation: `Feels like ${Math.round(effectiveTemp)}°C. Risk of frostbite with prolonged exposure.`,
      recommendedAction: 'Dress in warm layers. Cover head, hands, and feet. Limit outdoor exposure.',
      observationTime: time,
      source,
    })
  } else if (effectiveTemp <= 10 && windSpeed > 5) {
    advisories.push({
      id: `wind-chill-${time.getTime()}`,
      severity: 'info',
      category: 'Cold',
      title: 'Wind Chill Advisory',
      explanation: `Temperature ${Math.round(temp)}°C with wind making it feel like ${Math.round(feelsLike)}°C.`,
      recommendedAction: 'Wear wind-resistant outer layer. Cover exposed skin.',
      observationTime: time,
      source,
    })
  }

  return advisories
}

/**
 * Check for precipitation advisories
 */
function checkPrecipitationAdvisory(
  precipitationProb: number,
  precipitation: number,
  weatherCode: number,
  time: Date,
  source: 'current' | 'hourly' | 'daily'
): WeatherAdvisory[] {
  const advisories: WeatherAdvisory[] = []

  // Check for thunderstorm
  const isThunderstorm = [95, 96, 99].includes(weatherCode)
  if (isThunderstorm) {
    advisories.push({
      id: `thunderstorm-${time.getTime()}`,
      severity: 'danger',
      category: 'Thunderstorm',
      title: 'Thunderstorm Warning',
      explanation: 'Thunderstorm detected or forecast. Lightning, heavy rain, and strong winds possible.',
      recommendedAction: 'Seek shelter indoors immediately. Avoid open areas, tall objects, and water. Unplug electronics.',
      observationTime: time,
      source,
    })
  }

  // Check for heavy precipitation
  const heavyPrecipCodes = [55, 57, 65, 67, 75, 82, 86]
  const isHeavyPrecip = heavyPrecipCodes.includes(weatherCode) || precipitation > 10

  if (isHeavyPrecip && !isThunderstorm) {
    advisories.push({
      id: `heavy-precip-${time.getTime()}`,
      severity: 'warning',
      category: 'Precipitation',
      title: 'Heavy Precipitation Expected',
      explanation: `Heavy ${isThunderstorm ? 'rain' : 'precipitation'} forecast (${precipitation.toFixed(1)}mm). Risk of flooding and reduced visibility.`,
      recommendedAction: 'Avoid travel if possible. Do not drive through flooded roads. Carry waterproof gear.',
      observationTime: time,
      source,
    })
  } else if (precipitationProb >= 80 && precipitation > 0) {
    advisories.push({
      id: `high-precip-chance-${time.getTime()}`,
      severity: 'warning',
      category: 'Precipitation',
      title: 'High Chance of Rain',
      explanation: `${precipitationProb}% chance of precipitation (${precipitation.toFixed(1)}mm expected).`,
      recommendedAction: 'Carry umbrella or raincoat. Plan indoor alternatives for outdoor activities.',
      observationTime: time,
      source,
    })
  } else if (precipitationProb >= 50 && precipitation > 0) {
    advisories.push({
      id: `moderate-precip-chance-${time.getTime()}`,
      severity: 'info',
      category: 'Precipitation',
      title: 'Rain Likely',
      explanation: `${precipitationProb}% chance of precipitation (${precipitation.toFixed(1)}mm expected).`,
      recommendedAction: 'Carry light rain protection. Consider indoor backup plans.',
      observationTime: time,
      source,
    })
  }

  return advisories
}

/**
 * Check for wind advisories
 */
function checkWindAdvisory(
  windSpeed: number, // m/s
  time: Date,
  source: 'current' | 'hourly' | 'daily'
): WeatherAdvisory[] {
  const advisories: WeatherAdvisory[] = []
  const kmh = windSpeed * 3.6

  if (kmh >= 60) {
    advisories.push({
      id: `gale-${time.getTime()}`,
      severity: 'danger',
      category: 'Wind',
      title: 'Gale Force Winds',
      explanation: `Winds up to ${Math.round(kmh)} km/h. Risk of falling debris, tree damage, and dangerous travel conditions.`,
      recommendedAction: 'Stay indoors. Secure loose objects. Avoid travel, especially high-profile vehicles.',
      observationTime: time,
      source,
    })
  } else if (kmh >= 40) {
    advisories.push({
      id: `strong-wind-${time.getTime()}`,
      severity: 'warning',
      category: 'Wind',
      title: 'Strong Wind Advisory',
      explanation: `Winds up to ${Math.round(kmh)} km/h. Difficult walking conditions. Risk of falling branches.`,
      recommendedAction: 'Secure loose outdoor items. Use caution when driving high-profile vehicles. Avoid coastal areas.',
      observationTime: time,
      source,
    })
  } else if (kmh >= 20) {
    advisories.push({
      id: `windy-${time.getTime()}`,
      severity: 'info',
      category: 'Wind',
      title: 'Windy Conditions',
      explanation: `Winds up to ${Math.round(kmh)} km/h. Noticeable wind resistance.`,
      recommendedAction: 'Secure lightweight objects. Use caution with umbrellas and light structures.',
      observationTime: time,
      source,
    })
  }

  return advisories
}

/**
 * Check for UV index advisories
 */
function checkUVAdvisory(
  uvIndex: number | undefined,
  time: Date,
  source: 'current' | 'hourly' | 'daily'
): WeatherAdvisory[] {
  if (uvIndex === undefined || uvIndex === null) return []

  const advisories: WeatherAdvisory[] = []

  if (uvIndex >= 11) {
    advisories.push({
      id: `uv-extreme-${time.getTime()}`,
      severity: 'danger',
      category: 'UV Exposure',
      title: 'Extreme UV Index',
      explanation: `UV Index ${uvIndex.toFixed(0)}. Unprotected skin can burn in minutes.`,
      recommendedAction: 'Avoid sun exposure 10 AM - 4 PM. Wear SPF 50+ sunscreen, wide-brim hat, sunglasses, and protective clothing. Seek shade.',
      observationTime: time,
      source,
    })
  } else if (uvIndex >= 8) {
    advisories.push({
      id: `uv-very-high-${time.getTime()}`,
      severity: 'warning',
      category: 'UV Exposure',
      title: 'Very High UV Index',
      explanation: `UV Index ${uvIndex.toFixed(0)}. High risk of sunburn.`,
      recommendedAction: 'Apply SPF 30+ sunscreen. Wear hat, sunglasses, and protective clothing. Seek shade during peak hours.',
      observationTime: time,
      source,
    })
  } else if (uvIndex >= 6) {
    advisories.push({
      id: `uv-high-${time.getTime()}`,
      severity: 'warning',
      category: 'UV Exposure',
      title: 'High UV Index',
      explanation: `UV Index ${uvIndex.toFixed(0)}. Moderate to high risk of sunburn.`,
      recommendedAction: 'Apply SPF 30+ sunscreen. Wear hat and sunglasses. Limit direct sun exposure during midday.',
      observationTime: time,
      source,
    })
  } else if (uvIndex >= 3) {
    advisories.push({
      id: `uv-moderate-${time.getTime()}`,
      severity: 'info',
      category: 'UV Exposure',
      title: 'Moderate UV Index',
      explanation: `UV Index ${uvIndex.toFixed(0)}. Some risk of sunburn with prolonged exposure.`,
      recommendedAction: 'Apply sunscreen if outdoors for extended periods. Wear hat and sunglasses.',
      observationTime: time,
      source,
    })
  }

  return advisories
}

/**
 * Check for fog/visibility advisories
 */
function checkVisibilityAdvisory(
  visibility: number | undefined, // meters
  weatherCode: number,
  time: Date,
  source: 'current' | 'hourly' | 'daily'
): WeatherAdvisory[] {
  const advisories: WeatherAdvisory[] = []

  // Fog codes
  const isFog = [45, 48].includes(weatherCode)
  const lowVisibility = visibility !== undefined && visibility < 1000

  if (isFog || lowVisibility) {
    const visText = visibility !== undefined
      ? `${(visibility / 1000).toFixed(1)} km`
      : 'very low'

    advisories.push({
      id: `fog-${time.getTime()}`,
      severity: lowVisibility ? 'warning' : 'info',
      category: 'Visibility',
      title: isFog ? 'Fog Advisory' : 'Low Visibility',
      explanation: `Visibility reduced to ${visText}. Driving conditions hazardous.`,
      recommendedAction: 'Use low-beam headlights. Reduce speed. Increase following distance. Avoid travel if possible.',
      observationTime: time,
      source,
    })
  }

  return advisories
}

/**
 * Generate general preparedness advisories based on daily forecast
 */
function checkGeneralPreparedness(
  dailyData: ProcessedDailyData[]
): WeatherAdvisory[] {
  const advisories: WeatherAdvisory[] = []

  // Check next 7 days for significant weather
  const hasHeavyRain = dailyData.some(d => d.precipitationSum > 20)
  const hasThunderstorm = dailyData.some(d => [95, 96, 99].includes(d.weatherCode))
  const hasExtremeHeat = dailyData.some(d => d.tempMax >= 35)
  const hasExtremeCold = dailyData.some(d => d.tempMin <= 0)
  const hasHighWind = dailyData.some(d => d.windSpeedMax > 15) // ~54 km/h
  const hasExtremeUV = dailyData.some(d => (d.uvIndexMax ?? 0) >= 11)

  if (hasThunderstorm) {
    advisories.push({
      id: `prep-thunderstorm-${Date.now()}`,
      severity: 'warning',
      category: 'Preparedness',
      title: 'Thunderstorms Expected This Week',
      explanation: 'Thunderstorms are forecast within the next 7 days.',
      recommendedAction: 'Monitor daily forecasts. Have emergency kit ready. Know your safe shelter locations.',
      observationTime: new Date(),
      source: 'daily',
    })
  }

  if (hasHeavyRain) {
    advisories.push({
      id: `prep-heavy-rain-${Date.now()}`,
      severity: 'info',
      category: 'Preparedness',
      title: 'Heavy Rain Expected This Week',
      explanation: 'Significant rainfall is forecast within the next 7 days.',
      recommendedAction: 'Check drainage around home. Prepare for potential flooding. Keep emergency supplies accessible.',
      observationTime: new Date(),
      source: 'daily',
    })
  }

  if (hasExtremeHeat) {
    advisories.push({
      id: `prep-heat-${Date.now()}`,
      severity: 'info',
      category: 'Preparedness',
      title: 'Extreme Heat Expected This Week',
      explanation: 'Temperatures of 35°C or higher are forecast within the next 7 days.',
      recommendedAction: 'Ensure cooling systems work. Stock water. Plan activities for cooler hours. Check on vulnerable neighbors.',
      observationTime: new Date(),
      source: 'daily',
    })
  }

  if (hasExtremeCold) {
    advisories.push({
      id: `prep-cold-${Date.now()}`,
      severity: 'info',
      category: 'Preparedness',
      title: 'Freezing Temperatures Expected This Week',
      explanation: 'Temperatures at or below 0°C are forecast within the next 7 days.',
      recommendedAction: 'Insulate pipes. Check heating systems. Prepare warm clothing. Protect plants and pets.',
      observationTime: new Date(),
      source: 'daily',
    })
  }

  if (hasHighWind) {
    advisories.push({
      id: `prep-wind-${Date.now()}`,
      severity: 'info',
      category: 'Preparedness',
      title: 'High Winds Expected This Week',
      explanation: 'Strong winds (50+ km/h) are forecast within the next 7 days.',
      recommendedAction: 'Secure outdoor furniture and decorations. Trim dead tree branches. Prepare for potential power outages.',
      observationTime: new Date(),
      source: 'daily',
    })
  }

  if (hasExtremeUV) {
    advisories.push({
      id: `prep-uv-${Date.now()}`,
      severity: 'info',
      category: 'Preparedness',
      title: 'Extreme UV Index Expected This Week',
      explanation: 'UV Index of 11+ (Extreme) is forecast within the next 7 days.',
      recommendedAction: 'Apply SPF 50+ sunscreen. Wear protective clothing, wide-brim hat, and sunglasses. Avoid sun exposure 10 AM - 4 PM.',
      observationTime: new Date(),
      source: 'daily',
    })
  }

  return advisories
}

/**
 * Main function to generate all advisories from weather data
 */
export function generateAdvisories(
  current: ProcessedHourlyData | null,
  hourly: ProcessedHourlyData[],
  daily: ProcessedDailyData[]
): WeatherAdvisory[] {
  const allAdvisories: WeatherAdvisory[] = []

  // Current conditions advisories
  if (current) {
    allAdvisories.push(
      ...checkHeatAdvisory(current.temperature, current.feelsLike, current.humidity, current.time, 'current'),
      ...checkColdAdvisory(current.temperature, current.feelsLike, current.windSpeed, current.time, 'current'),
      ...checkPrecipitationAdvisory(current.precipitationProbability, current.precipitation, current.weatherCode, current.time, 'current'),
      ...checkWindAdvisory(current.windSpeed, current.time, 'current'),
      ...checkUVAdvisory(current.uvIndex, current.time, 'current'),
      ...checkVisibilityAdvisory(current.visibility, current.weatherCode, current.time, 'current')
    )
  }

  // Next 24 hours hourly advisories (limit to avoid spam)
  const next24Hours = hourly.filter(h => h.time > new Date() && h.time <= new Date(Date.now() + 24 * 60 * 60 * 1000))
  const hourlySample = next24Hours.filter((_, i) => i % 3 === 0) // Every 3 hours

  for (const hour of hourlySample) {
    allAdvisories.push(
      ...checkHeatAdvisory(hour.temperature, hour.feelsLike, hour.humidity, hour.time, 'hourly'),
      ...checkColdAdvisory(hour.temperature, hour.feelsLike, hour.windSpeed, hour.time, 'hourly'),
      ...checkPrecipitationAdvisory(hour.precipitationProbability, hour.precipitation, hour.weatherCode, hour.time, 'hourly'),
      ...checkWindAdvisory(hour.windSpeed, hour.time, 'hourly'),
      ...checkUVAdvisory(hour.uvIndex, hour.time, 'hourly'),
      ...checkVisibilityAdvisory(hour.visibility, hour.weatherCode, hour.time, 'hourly')
    )
  }

  // Daily forecast advisories (next 7 days)
  for (const day of daily) {
    allAdvisories.push(
      ...checkHeatAdvisory(day.tempMax, day.feelsLikeMax, 50, day.date, 'daily'), // Assume moderate humidity for daily max
      ...checkColdAdvisory(day.tempMin, day.feelsLikeMin, day.windSpeedMax / 3.6, day.date, 'daily'),
      ...checkPrecipitationAdvisory(day.precipitationProbability, day.precipitationSum, day.weatherCode, day.date, 'daily'),
      ...checkWindAdvisory(day.windSpeedMax / 3.6, day.date, 'daily'), // Convert from m/s
      ...checkUVAdvisory(day.uvIndexMax, day.date, 'daily')
    )
  }

  // General preparedness advisories
  allAdvisories.push(...checkGeneralPreparedness(daily))

  // Deduplicate by category + severity + similar time window
  const deduplicated = deduplicateAdvisories(allAdvisories)

  // Sort by severity (danger > warning > info) then by time
  const severityOrder: Record<AdvisorySeverity, number> = { danger: 0, warning: 1, info: 2 }

  return deduplicated.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff
    return a.observationTime.getTime() - b.observationTime.getTime()
  })
}

/**
 * Deduplicate similar advisories
 */
function deduplicateAdvisories(advisories: WeatherAdvisory[]): WeatherAdvisory[] {
  const seen = new Map<string, WeatherAdvisory>()

  for (const advisory of advisories) {
    // Create a key based on category, severity, and hour of observation
    const hourKey = advisory.observationTime.getHours()
    const key = `${advisory.category}-${advisory.severity}-${hourKey}`

    const existing = seen.get(key)
    if (!existing || advisory.severity === 'danger' && existing.severity !== 'danger') {
      seen.set(key, advisory)
    }
  }

  return Array.from(seen.values())
}

/**
 * Get the official PAGASA website link for reference
 */
export const PAGASA_URL = 'https://www.pagasa.dost.gov.ph/'

/**
 * Disclaimer text for advisory display
 */
export const ADVISORY_DISCLAIMER = 'These recommendations are generated from forecast data and are not official weather warnings. For official Philippine weather information, visit PAGASA.'