/**
 * Favorites Panel Component - Premium Redesign
 * Displays and manages saved/favorite locations with beautiful cards.
 */

import { type FC } from 'react'
import { Icon } from './Icon'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Badge } from './Badge'
import { EmptyState } from './States'
import type { SavedLocation } from '../types/location'
import { formatRelativeDay } from '../utils/date'

interface FavoritesPanelProps {
  locations: SavedLocation[]
  currentLocationId: string | null
  onSelect: (location: SavedLocation) => void
  onRemove: (id: string) => void
  onClearAll: () => void
  isLoading?: boolean
}

export const FavoritesPanel: FC<FavoritesPanelProps> = ({
  locations,
  currentLocationId,
  onSelect,
  onRemove,
  onClearAll,
  isLoading = false,
}) => {
  if (isLoading) return null

  if (!locations.length) {
    return (
      <EmptyState
        icon="MapPin"
        title="No saved locations yet"
        message="Search for a location and select it — it will be saved here so you can switch back to it quickly."
        action={{ label: 'Find a location', onClick: () => {} }}
      />
    )
  }

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 p-5 sm:p-6 border-b border-border-subtle">
        <div className="min-w-0">
          <CardTitle size="lg">Saved Locations</CardTitle>
          <p className="mt-1 text-sm text-text-tertiary">
            {locations.length} location{locations.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        {locations.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-semantic-danger hover:bg-semantic-danger-soft hover:text-semantic-danger-strong"
          >
            <Icon icon="Trash2" size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Clear All</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border-subtle" role="list" aria-label="Saved locations">
          {locations.map(location => {
            const isCurrent = location.id === currentLocationId
            return (
              <li
                key={location.id}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5 transition-all duration-fast ${
                  isCurrent ? 'bg-brand-primary-light/50 dark:bg-brand-primary/10 border-l-4 border-brand-primary' : 'hover:bg-surface-2'
                }`}
                role="listitem"
              >
                <button
                  type="button"
                  onClick={() => onSelect(location)}
                  className="flex w-full min-w-0 items-center gap-3 rounded-xl text-left p-2 transition-all duration-fast hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
                  aria-label={`Load weather for ${location.name}`}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  <div className={`flex shrink-0 items-center justify-center rounded-xl ${isCurrent ? 'icon-container-brand' : 'icon-container-muted'}`} style={{ width: '48px', height: '48px' }}>
                    <Icon
                      icon={isCurrent ? 'Navigation' : 'MapPin'}
                      size={22}
                      className={isCurrent ? undefined : 'text-text-tertiary'}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-text-primary">
                        {location.name}
                      </span>
                      {isCurrent && <Badge variant="primary" size="sm">Current</Badge>}
                      {location.isDefault && <Badge variant="outline" size="sm">Default</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-text-tertiary">
                      {[location.admin1, location.country].filter(Boolean).join(', ') || '—'}
                    </p>
                    <p className="mt-1 text-xs text-text-quaternary">
                      Added {formatRelativeDay(new Date(location.addedAt))}
                    </p>
                  </div>
                </button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(location.id)}
                  aria-label={`Remove ${location.name} from favorites`}
                  className="w-full shrink-0 sm:w-auto text-text-tertiary hover:text-semantic-danger hover:bg-semantic-danger-soft"
                >
                  <Icon icon="Trash2" size={16} aria-hidden="true" />
                  <span className="hidden sm:inline ml-1.5">Remove</span>
                </Button>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}