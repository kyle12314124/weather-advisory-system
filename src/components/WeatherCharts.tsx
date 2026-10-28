/**
 * Weather Charts Component using Recharts - Premium Redesign
 * Theme-aware temperature and precipitation charts with beautiful styling.
 */

import { type FC, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ValueType, NameType, Formatter } from 'recharts/types/component/DefaultTooltipContent'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { EmptyState } from './States'
import { formatChartHour, formatChartDate } from '../utils/date'
import type { ProcessedHourlyData, ProcessedDailyData } from '../types/weather'
import type { TemperatureUnit, PrecipitationUnit } from '../types/settings'

interface WeatherChartsProps {
  hourly: ProcessedHourlyData[]
  daily: ProcessedDailyData[]
  temperatureUnit: TemperatureUnit
  precipitationUnit: PrecipitationUnit
  use24Hour: boolean
  timezone: string
}

type FormatterFn = Formatter<ValueType, NameType>

export const WeatherCharts: FC<WeatherChartsProps> = ({
  hourly,
  daily,
  temperatureUnit,
  precipitationUnit,
  use24Hour,
  timezone,
}) => {
  const hourlyTempData = useMemo(() => {
    const formatOpts = { timeZone: timezone }
    return hourly.slice(0, 24).map(h => ({
      time: formatChartHour(h.time, use24Hour, formatOpts),
      temperature: h.temperature,
      feelsLike: h.feelsLike,
      hour: h.time,
    }))
  }, [hourly, use24Hour, timezone])

  const hourlyPrecipData = useMemo(() => {
    const formatOpts = { timeZone: timezone }
    return hourly.slice(0, 24).map(h => ({
      time: formatChartHour(h.time, use24Hour, formatOpts),
      precipitation: h.precipitation,
      hour: h.time,
    }))
  }, [hourly, use24Hour, timezone])

  const dailyTempData = useMemo(() => {
    const formatOpts = { timeZone: timezone }
    return daily.slice(0, 7).map(d => ({
      date: formatChartDate(d.date, formatOpts),
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      feelsLikeMax: d.feelsLikeMax,
      feelsLikeMin: d.feelsLikeMin,
      dateObj: d.date,
    }))
  }, [daily, timezone])

  const dailyPrecipData = useMemo(() => {
    const formatOpts = { timeZone: timezone }
    return daily.slice(0, 7).map(d => ({
      date: formatChartDate(d.date, formatOpts),
      precipitation: d.precipitationSum,
      dateObj: d.date,
    }))
  }, [daily, timezone])

  if (!hourlyTempData.length && !dailyTempData.length) {
    return (
      <EmptyState
        icon="BarChart"
        title="No chart data available"
        message="Weather data is required to display charts. Please ensure a location is selected and data has loaded."
      />
    )
  }

  const tempSuffix = temperatureUnit === 'fahrenheit' ? '°F' : '°C'
  const precipSuffix = precipitationUnit === 'inch' ? 'in' : 'mm'

  const getNumericValue = (value: ValueType | undefined): number | undefined => {
    if (value === undefined || value === null) return undefined
    if (typeof value === 'number') return value
    if (typeof value === 'string') return Number(value)
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0]
      if (typeof first === 'number') return first
      if (typeof first === 'string') return Number(first)
    }
    return undefined
  }

  const hourlyTempTooltipFormatter: FormatterFn = (value, _name) => {
    const num = getNumericValue(value)
    return [num !== undefined ? `${num}${tempSuffix}` : '—', 'Temperature']
  }

  const hourlyPrecipTooltipFormatter: FormatterFn = (value, _name) => {
    const num = getNumericValue(value)
    return [num !== undefined ? `${num.toFixed(1)}${precipSuffix}` : '—', 'Precipitation']
  }

  const dailyTempTooltipFormatter: FormatterFn = (value, name) => {
    const num = getNumericValue(value)
    const labels: Record<string, string> = {
      tempMax: 'High',
      tempMin: 'Low',
      feelsLikeMax: 'Feels Like High',
      feelsLikeMin: 'Feels Like Low',
    }
    return [
      num !== undefined ? `${num}${tempSuffix}` : '—',
      name ? labels[String(name)] || String(name) : 'Temperature',
    ]
  }

  const dailyPrecipTooltipFormatter: FormatterFn = (value, _name) => {
    const num = getNumericValue(value)
    return [num !== undefined ? `${num.toFixed(1)}${precipSuffix}` : '—', 'Precipitation']
  }

  const tooltipContentStyle = {
    backgroundColor: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-lg)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    padding: '12px 16px',
  }

  const tooltipLabelStyle = {
    color: 'var(--text-tertiary)',
    fontWeight: 600,
    marginBottom: '8px',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const axisTick = { fill: 'var(--chart-tick)', fontSize: 11, fontFamily: 'var(--font-sans)' }
  const legendStyle = { color: 'var(--chart-tick)', fontSize: '12px', fontFamily: 'var(--font-sans)' }

  const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 }

  return (
    <div className="space-y-5" role="region" aria-label="Weather charts">
      {/* Hourly Temperature Chart */}
      {hourlyTempData.length > 0 && (
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle size="lg">Hourly Temperature (Next 24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyTempData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    interval={hourlyTempData.length > 12 ? 2 : 1}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}${tempSuffix}`}
                    tickMargin={8}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    cursor={{ stroke: 'var(--chart-tick)', strokeOpacity: 0.4, strokeDasharray: '2 2' }}
                    labelFormatter={(_, payload) => {
                      const item = payload[0]?.payload
                      if (!item) return ''
                      return formatChartHour(item.hour, use24Hour, { timeZone: timezone })
                    }}
                    formatter={hourlyTempTooltipFormatter}
                  />
                  <Legend wrapperStyle={legendStyle} iconType="line" layout="horizontal" verticalAlign="top" />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="var(--chart-line-1)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--chart-line-1)' }}
                    name="Temperature"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="feelsLike"
                    stroke="var(--chart-line-2)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--chart-line-2)' }}
                    name="Feels Like"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hourly Precipitation Chart */}
      {hourlyPrecipData.length > 0 && (
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle size="lg">Hourly Precipitation (Next 24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyPrecipData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    interval={hourlyPrecipData.length > 12 ? 2 : 1}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}${precipSuffix}`}
                    tickMargin={8}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.4 }}
                    labelFormatter={(_, payload) => {
                      const item = payload[0]?.payload
                      if (!item) return ''
                      return formatChartHour(item.hour, use24Hour, { timeZone: timezone })
                    }}
                    formatter={hourlyPrecipTooltipFormatter}
                  />
                  <Bar
                    dataKey="precipitation"
                    fill="var(--chart-precip)"
                    radius={[4, 4, 0, 0]}
                    name="Precipitation"
                                        animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Temperature Chart */}
      {dailyTempData.length > 0 && (
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle size="lg">7-Day Temperature Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTempData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}${tempSuffix}`}
                    tickMargin={8}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    cursor={{ stroke: 'var(--chart-tick)', strokeOpacity: 0.4, strokeDasharray: '2 2' }}
                    labelFormatter={(_, payload) => {
                      const item = payload[0]?.payload
                      if (!item) return ''
                      return formatChartDate(item.dateObj, { timeZone: timezone })
                    }}
                    formatter={dailyTempTooltipFormatter}
                  />
                  <Legend wrapperStyle={legendStyle} iconType="line" layout="horizontal" verticalAlign="top" />
                  <Line
                    type="monotone"
                    dataKey="tempMax"
                    stroke="var(--chart-high)"
                    strokeWidth={2.5}
                    dot={{ r: 5, strokeWidth: 2 }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: 'var(--chart-high)' }}
                    name="High"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="tempMin"
                    stroke="var(--chart-low)"
                    strokeWidth={2.5}
                    dot={{ r: 5, strokeWidth: 2 }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: 'var(--chart-low)' }}
                    name="Low"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="feelsLikeMax"
                    stroke="var(--chart-feel-high)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--chart-feel-high)' }}
                    name="Feels Like High"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="feelsLikeMin"
                    stroke="var(--chart-feel-low)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--chart-feel-low)' }}
                    name="Feels Like Low"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Precipitation Chart */}
      {dailyPrecipData.length > 0 && (
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle size="lg">7-Day Precipitation Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPrecipData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}${precipSuffix}`}
                    tickMargin={8}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.4 }}
                    labelFormatter={(_, payload) => {
                      const item = payload[0]?.payload
                      if (!item) return ''
                      return formatChartDate(item.dateObj, { timeZone: timezone })
                    }}
                    formatter={dailyPrecipTooltipFormatter}
                  />
                  <Bar
                    dataKey="precipitation"
                    fill="var(--chart-precip)"
                    radius={[4, 4, 0, 0]}
                    name="Precipitation"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}