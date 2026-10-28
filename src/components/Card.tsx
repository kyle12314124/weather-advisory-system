/**
 * Card Component - Premium Design System
 * Consistent container styling with multiple elevation levels
 */

import { forwardRef, type HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'filled' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'card-base',
      elevated: 'card-elevated',
      outlined: 'card-outlined',
      glass: 'card-glass',
      filled: 'card-filled',
      interactive: 'card-interactive',
    }

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
      xl: 'p-8 sm:p-10 lg:p-12',
    }

    const hoverStyle = hover && variant !== 'elevated' && variant !== 'interactive'
      ? 'transition-shadow duration-normal ease-out hover:shadow-lg'
      : ''

    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyle} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card sub-components
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, as: Component = 'h3', size = 'base', className = '', ...props }, ref) => {
    const sizeStyles = {
      sm: 'text-lg font-semibold',
      base: 'text-xl font-semibold',
      lg: 'text-2xl font-bold',
      xl: 'text-3xl font-bold',
      '2xl': 'text-4xl font-bold',
      '3xl': 'text-5xl font-bold',
    }
    return (
      <Component
        ref={ref}
        className={`${sizeStyles[size]} text-text-primary tracking-tight ${className}`}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

CardTitle.displayName = 'CardTitle'

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className = '', ...props }, ref) => (
    <p
      ref={ref}
      className={`mt-1.5 text-text-tertiary ${className}`}
      {...props}
    >
      {children}
    </p>
  )
)

CardDescription.displayName = 'CardDescription'

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
)

CardContent.displayName = 'CardContent'

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`mt-6 flex items-center gap-4 border-t border-border-subtle pt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'