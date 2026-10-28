/**
 * Badge Component - Premium Design System
 * Status indicators and labels with consistent styling
 */

import { type HTMLAttributes, forwardRef } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', dot = false, className = '', ...props }, ref) => {
    const variantStyles = {
      default: 'badge badge-secondary',
      primary: 'badge badge-primary',
      secondary: 'badge badge-secondary',
      accent: 'badge badge-accent',
      success: 'badge badge-success',
      warning: 'badge badge-warning',
      danger: 'badge badge-danger',
      info: 'badge badge-info',
      outline: 'badge badge-outline',
    }

    const sizeStyles = {
      sm: 'badge-sm',
      md: 'badge-md',
      lg: 'badge-lg',
    }

    const dotStyle = dot ? 'badge-dot' : ''

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${dotStyle} ${className}`}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'