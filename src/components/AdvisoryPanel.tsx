/**
 * Advisory Panel Component - Premium Redesign
 * Displays rule-based weather advisories with sophisticated visual design.
 * Clearly distinguishes application-generated advisories from official PAGASA warnings.
 */

import { type FC } from 'react'
import { Icon } from './Icon'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import type { WeatherAdvisory, AdvisorySeverity } from '../services/advisoryEngine'

interface AdvisoryPanelProps {
  advisories: WeatherAdvisory[]
  highestSeverity: AdvisorySeverity | null
  hasCriticalAdvisories: boolean
  pagasaUrl: string
  disclaimer: string
}

const severityConfig: Record<AdvisorySeverity, {
  label: string
  icon: string
  chip: string
  bar: string
  text: string
  badgeVariant: 'success' | 'warning' | 'danger' | 'info'
  bg: string
  iconBg: string
}> = {
  danger: {
    label: 'Danger',
    icon: 'AlertOctagon',
    chip: 'bg-semantic-danger-soft text-semantic-danger-strong',
    bar: 'border-l-semantic-danger',
    text: 'text-semantic-danger-strong',
    badgeVariant: 'danger',
    bg: 'bg-semantic-danger/5',
    iconBg: 'bg-semantic-danger-soft text-semantic-danger-strong',
  },
  warning: {
    label: 'Warning',
    icon: 'AlertTriangle',
    chip: 'bg-semantic-warning-soft text-semantic-warning-strong',
    bar: 'border-l-semantic-warning',
    text: 'text-semantic-warning-strong',
    badgeVariant: 'warning',
    bg: 'bg-semantic-warning/5',
    iconBg: 'bg-semantic-warning-soft text-semantic-warning-strong',
  },
  info: {
    label: 'Information',
    icon: 'Info',
    chip: 'bg-semantic-info-soft text-semantic-info-strong',
    bar: 'border-l-semantic-info',
    text: 'text-semantic-info-strong',
    badgeVariant: 'info',
    bg: 'bg-semantic-info/5',
    iconBg: 'bg-semantic-info-soft text-semantic-info-strong',
  },
}

const formatAdvisoryTime = (date: Date): string =>
  date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export const AdvisoryPanel: FC<AdvisoryPanelProps> = ({
  advisories,
  highestSeverity,
  hasCriticalAdvisories,
  pagasaUrl,
  disclaimer,
}) => {
  const grouped = {
    danger: advisories.filter(a => a.severity === 'danger'),
    warning: advisories.filter(a => a.severity === 'warning'),
    info: advisories.filter(a => a.severity === 'info'),
  }

  return (
    <section aria-label="Weather advisories" className="animate-fade-in delay-4 space-y-5">
      {/* PAGASA distinction callout - generated vs official */}
      <Card variant="glass" padding="lg" className="border-brand-primary/20">
        <div className="flex items-start gap-4">
          <div className="icon-container icon-container-md icon-container-brand shrink-0">
            <Icon icon="ShieldAlert" size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary">Auto-Generated Advisories</h3>
            <p className="mt-1.5 text-sm text-text-secondary">
              These advisories are computed from Open-Meteo forecast data by this application — they are
              <strong className="font-semibold text-text-primary"> not </strong> official warnings. For official
              Philippine weather bulletins, visit{' '}
              <a
                href={pagasaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-primary hover:underline underline-offset-2"
              >
                PAGASA
              </a>
              .
            </p>
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle size="lg">Weather Advisories</CardTitle>
            {hasCriticalAdvisories && highestSeverity && (
              <Badge variant={severityConfig[highestSeverity].badgeVariant} size="lg" dot>
                {highestSeverity === 'danger' ? 'Critical' : 'Caution'}
              </Badge>
            )}
          </div>
          <a
            href={pagasaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            <Icon icon="ExternalLink" size={14} aria-hidden="true" />
            Official PAGASA Alerts
          </a>
        </CardHeader>

        <CardContent className="space-y-5">
          {advisories.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 icon-container icon-container-xl icon-container-success">
                <Icon icon="CheckCircle" size={32} aria-hidden="true" />
              </div>
              <p className="font-semibold text-text-primary">No weather advisories at this time.</p>
              <p className="mt-1.5 text-sm text-text-tertiary">Conditions are normal for your location.</p>
            </div>
          ) : (
            (['danger', 'warning', 'info'] as const).map(severity => {
              const items = grouped[severity]
              if (!items.length) return null
              const config = severityConfig[severity]

              return (
                <div key={severity} className="space-y-3 animate-slide-up">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.chip}`}>
                      <Icon icon={config.icon} size={16} aria-hidden="true" />
                    </span>
                    <h4 className="text-sm font-semibold text-text-primary">{config.label}</h4>
                    <Badge variant={config.badgeVariant} size="md">{items.length}</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {items.map(advisory => (
                      <AdvisoryItem key={advisory.id} advisory={advisory} config={config} />
                    ))}
                  </div>
                </div>
              )
            })
          )}

          <p className="border-t border-border-subtle pt-4 text-center text-xs text-text-tertiary">
            {disclaimer}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

interface AdvisoryItemProps {
  advisory: WeatherAdvisory
  config: (typeof severityConfig)[AdvisorySeverity]
}

const AdvisoryItem: FC<AdvisoryItemProps> = ({ advisory, config }) => (
  <div
    className={`card-interactive border-l-4 ${config.bar} ${config.bg} p-4 group`}
    role="alert"
    aria-live="polite"
  >
    <div className="flex items-start gap-3">
      <Badge variant={config.badgeVariant} size="sm" className="mt-0.5 shrink-0">
        {advisory.category}
      </Badge>
      <div className="min-w-0 flex-1">
        <h5 className="font-semibold text-text-primary">{advisory.title}</h5>
        <p className="mt-1.5 text-sm text-text-secondary">{advisory.explanation}</p>
        <p className="mt-2.5 text-sm text-text-primary">
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${config.text}`}>
            Recommended:
          </span>{' '}
          {advisory.recommendedAction}
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-text-tertiary">
          <Icon icon="Clock" size={12} aria-hidden="true" />
          <span>
            Generated from {advisory.source} data{' '}
            {advisory.forecastTime
              ? `for ${advisory.forecastTime.toLocaleDateString()} ${formatAdvisoryTime(advisory.forecastTime)}`
              : `observed at ${formatAdvisoryTime(advisory.observationTime)}`}
          </span>
        </p>
      </div>
    </div>
  </div>
)

interface AdvisoryBannerProps {
  severity: 'danger' | 'warning'
  count: number
  onViewAdvisories: () => void
}

/**
 * Compact banner shown above the dashboard when critical advisories exist.
 */
export const AdvisoryBanner: FC<AdvisoryBannerProps> = ({ severity, count, onViewAdvisories }) => {
  const isDanger = severity === 'danger'
  const config = severityConfig[severity]

  return (
    <div
      className={`animate-slide-down card-interactive border-l-4 p-4 sm:flex sm:items-center ${
        isDanger
          ? 'border-semantic-danger bg-semantic-danger/5 dark:bg-semantic-danger/10'
          : 'border-semantic-warning bg-semantic-warning/5 dark:bg-semantic-warning/10'
      }`}
      role="alert"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.iconBg}`}>
        <Icon icon={config.icon} size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 mt-2 sm:mt-0">
        <p className="text-sm font-semibold text-text-primary">
          {count} active weather advis{count === 1 ? 'y' : 'ies'}
        </p>
        <p className="text-sm text-text-secondary">
          Review the recommended actions. Not an official PAGASA warning.
        </p>
      </div>
      <Button
        variant={isDanger ? 'danger' : 'secondary'}
        size="sm"
        onClick={onViewAdvisories}
        className="shrink-0 self-start sm:self-auto mt-2 sm:mt-0"
      >
        View advisories
      </Button>
    </div>
  )
}