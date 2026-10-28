/**
 * Loading, Error, Empty, and Offline state components - Premium Redesign
 * Includes dashboard loading skeletons with beautiful animations.
 */

import { type FC } from 'react'
import { Icon } from './Icon'
import { Button } from './Button'
import { Card, CardContent } from './Card'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingState: FC<LoadingStateProps> = ({
  message = 'Loading weather data...',
  size = 'md',
}) => {
  const sizePx = { sm: 20, md: 32, lg: 44 } as const

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
      <Icon
        icon="Loader"
        size={sizePx[size]}
        className="animate-spin text-brand-primary"
        aria-hidden="true"
      />
      <p className={`${textClasses[size]} mt-4 text-text-secondary`}>
        {message}
      </p>
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export const Skeleton: FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-shimmer rounded-xl ${className}`} aria-hidden="true" />
)

/**
 * Full-dashboard loading skeleton mirroring the actual layout:
 * hero card + hourly strip + daily list.
 */
export const WeatherSkeleton: FC = () => (
  <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading weather data">
    <span className="sr-only">Loading weather data…</span>

    {/* Hero skeleton */}
    <Card variant="elevated" padding="lg">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <Skeleton className="icon-container-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:max-w-md md:flex-1">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </Card>

    {/* Hourly strip skeleton */}
    <div>
      <Skeleton className="mb-4 h-5 w-48" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-52 w-32 shrink-0 rounded-xl" />
        ))}
      </div>
    </div>

    {/* Daily list skeleton */}
    <div>
      <Skeleton className="mb-4 h-5 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
)

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export const ErrorState: FC<ErrorStateProps> = ({
  message,
  onRetry,
  retryLabel = 'Try Again',
}) => {
  return (
    <Card variant="outlined" className="border-semantic-danger/30" role="alert">
      <CardContent className="py-10 text-center">
        <div className="mx-auto mb-4 icon-container icon-container-xl icon-container-danger">
          <Icon icon="AlertCircle" size={28} aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-text-primary">
          Something went wrong
        </h3>
        <p className="mx-auto mb-6 max-w-md text-text-secondary">{message}</p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry} leftIcon={<Icon icon="RefreshCw" size={16} aria-hidden="true" />}>
            {retryLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface EmptyStateProps {
  title: string
  message: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'Search',
  action,
}) => {
  return (
    <Card variant="elevated" padding="xl" className="text-center">
      <div className="mx-auto mb-4 icon-container icon-container-xl icon-container-muted">
        <Icon icon={icon} size={28} className="text-text-quaternary" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-text-primary">
        {title}
      </h3>
      <p className="mx-auto mb-6 max-w-md text-text-secondary">{message}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Card>
  )
}

interface OfflineStateProps {
  onRetry?: () => void
}

export const OfflineState: FC<OfflineStateProps> = ({ onRetry }) => {
  return (
    <Card variant="outlined" className="border-semantic-warning/30">
      <CardContent className="py-10 text-center">
        <div className="mx-auto mb-4 icon-container icon-container-xl icon-container-warning">
          <Icon icon="WifiOff" size={28} aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-text-primary">
          You're Offline
        </h3>
        <p className="mx-auto mb-6 max-w-md text-text-secondary">
          No internet connection detected. Weather data cannot be updated.
        </p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry} leftIcon={<Icon icon="RefreshCw" size={16} aria-hidden="true" />}>
            Retry Connection
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface OfflineBannerProps {
  onRetry?: () => void
  lastUpdated?: Date | null
  use24Hour?: boolean
}

/**
 * Inline offline banner shown at the top of the app when offline
 * but cached data is available.
 */
export const OfflineBanner: FC<OfflineBannerProps> = ({ onRetry, lastUpdated, use24Hour }) => {
  return (
    <div
      className="border-b border-semantic-warning/30 bg-semantic-warning/5 px-4 py-2"
      role="status"
      aria-live="polite"
      aria-label="Offline notification"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-semantic-warning">
          <Icon icon="WifiOff" size={16} className="shrink-0" aria-hidden="true" />
          <span>You're offline — showing cached data</span>
          {lastUpdated && (
            <>
              <span className="mx-1" aria-hidden="true">·</span>
              <span>Last updated {lastUpdated.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: !use24Hour })}</span>
            </>
          )}
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<Icon icon="RefreshCw" size={14} aria-hidden="true" />}>
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}