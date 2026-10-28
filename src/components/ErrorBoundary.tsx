/**
 * React Error Boundary Component
 * Catches render errors in child components and displays a fallback UI.
 */

// oxlint-disable-next-line react/only-export-components
import { type ComponentType, type ReactNode, type ErrorInfo, Component } from 'react'
import { Card, CardContent } from './Card'
import { Button } from './Button'
import { Icon } from './Icon'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ error, errorInfo })
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4" role="alert">
          <Card className="border-semantic-danger/30">
            <CardContent className="py-6 text-center">
              <div className="icon-container icon-container-md icon-container-danger mx-auto mb-4">
                <Icon icon="AlertTriangle" size={24} aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                Something went wrong
              </h3>
              <p className="mx-auto mb-6 max-w-md text-text-secondary">
                We're sorry, but something unexpected happened. The error has been logged.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button variant="primary" onClick={this.handleReset} leftIcon={<Icon icon="RefreshCw" size={16} aria-hidden="true" />}>
                  Try Again
                </Button>
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </div>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-text-tertiary">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-semantic-danger-soft p-3 text-xs text-semantic-danger-strong">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\n'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC to wrap a component with ErrorBoundary
 */
// oxlint-disable-next-line react/only-export-components
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Hook to use error boundary state in child components
 * (for components that need to know if an error boundary caught an error)
 */
// oxlint-disable-next-line react/only-export-components
export function useErrorBoundary(): { hasError: boolean; reset: () => void } | null {
  // This would require context - simplified for now
  return null
}

export default ErrorBoundary