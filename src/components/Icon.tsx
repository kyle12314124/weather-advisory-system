/**
 * Icon component wrapper for Lucide React icons
 * Provides consistent sizing and styling
 */

import { forwardRef } from 'react'
import type { LucideIcon, LucideProps } from 'lucide-react'
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  HelpCircle,
  Wind,
  Droplet,
  Droplets,
  Eye,
  Gauge,
  Thermometer,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  CheckCircle,
  Search,
  X,
  MapPin,
  RefreshCw,
  Loader,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Plus,
  Trash2,
  Star,
  Settings,
  Calendar,
  BarChart,
  Sunrise,
  Sunset,
  RotateCcw,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Navigation,
  Monitor,
} from 'lucide-react'

export interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon | string
  size?: number | string
  className?: string
  'aria-label'?: string
}

// Map of icon names to Lucide icons
const ICON_MAP: Record<string, LucideIcon> = {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  HelpCircle,
  Wind,
  Droplet,
  Droplets,
  Eye,
  Gauge,
  Thermometer,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  CheckCircle,
  Search,
  X,
  MapPin,
  RefreshCw,
  Loader,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Plus,
  Trash2,
  Star,
  Settings,
  Calendar,
  BarChart,
  Sunrise,
  Sunset,
  RotateCcw,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Navigation,
  Monitor,
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size = 24, className = '', 'aria-label': ariaLabel, ...props }, ref) => {
    // If icon is a string, look it up in the map
    let Component: LucideIcon
    if (typeof IconComponent === 'string') {
      Component = ICON_MAP[IconComponent] || HelpCircle
    } else {
      Component = IconComponent
    }

    return (
      <Component
        ref={ref}
        size={size}
        className={className}
        aria-hidden={!ariaLabel}
        aria-label={ariaLabel}
        {...props}
      />
    )
  }
)

Icon.displayName = 'Icon'
