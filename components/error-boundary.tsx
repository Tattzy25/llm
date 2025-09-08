"use client"

/**
 * Enhanced Error Handling System
 *
 * This module provides a comprehensive error handling system with:
 * - Popup error notifications instead of fallback UI
 * - Enhanced error boundary with better UX
 * - Utility functions for consistent error handling
 * - Context-aware error messages
 *
 * Usage:
 * 1. Wrap your app with EnhancedErrorBoundary and GlobalErrorHandler in layout.tsx
 * 2. Use useErrorHandler hook in components for showing error popups
 * 3. Use errorUtils for consistent error handling patterns
 * 4. Call showError with context for better error categorization
 *
 * Example:
 * ```tsx
 * const { showError } = useErrorHandler()
 *
 * // Simple error
 * showError('Something went wrong')
 *
 * // Error with context
 * showError(error, 'API Request')
 *
 * // Using utilities
 * const result = await errorUtils.withErrorHandling(
 *   () => apiCall(),
 *   showError,
 *   'Data Fetching'
 * )
 * ```
 */

import * as React from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Instead of showing fallback UI, we'll let the error propagate
      // and rely on the error popup system
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Global Error Handler Component - Add this to your app layout
export function GlobalErrorHandler() {
  const { errors, dismissError, clearAllErrors } = useErrorHandler()

  return (
    <ErrorToast
      errors={errors}
      onDismiss={dismissError}
      onClearAll={clearAllErrors}
    />
  )
}

// Utility functions for consistent error handling
export const errorUtils = {
  // Handle async operations with error popup
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    showError: (error: Error | string, context?: string) => void,
    context: string,
    fallbackValue?: T
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      showError(errorObj, context)
      return fallbackValue
    }
  },

  // Handle sync operations with error popup
  withSyncErrorHandling<T>(
    operation: () => T,
    showError: (error: Error | string, context?: string) => void,
    context: string,
    fallbackValue?: T
  ): T | undefined {
    try {
      return operation()
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      showError(errorObj, context)
      return fallbackValue
    }
  },

  // Create user-friendly error messages
  getUserFriendlyErrorMessage(error: Error): string {
    if (error.message.includes('fetch')) {
      return 'Network connection failed. Please check your internet connection.'
    }
    if (error.message.includes('API')) {
      return 'API request failed. Please check your API key and try again.'
    }
    if (error.message.includes('storage') || error.message.includes('quota')) {
      return 'Storage limit exceeded. Please clear some data and try again.'
    }
    if (error.message.includes('JSON')) {
      return 'Data format error. Please refresh the page.'
    }
    return error.message || 'An unexpected error occurred.'
  }
}

// Hook for showing error toasts/notifications with enhanced features
export function useErrorHandler() {
  const [errors, setErrors] = React.useState<Array<{
    id: string
    error: Error
    timestamp: Date
    context?: string
  }>>([])

  const showError = React.useCallback((error: Error | string, context?: string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    const id = Date.now().toString()
    const timestamp = new Date()

    setErrors(prev => [...prev, {
      id,
      error: errorObj,
      timestamp,
      context
    }])

    // Log error for debugging
    console.error(`[${timestamp.toISOString()}] Error${context ? ` (${context})` : ''}:`, errorObj)

    // Auto-remove after 8 seconds for user errors, 15 seconds for system errors
    const timeout = errorObj.message.includes('API') || errorObj.message.includes('network') ? 15000 : 8000
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== id))
    }, timeout)
  }, [])

  const dismissError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id))
  }, [])

  const clearAllErrors = React.useCallback(() => {
    setErrors([])
  }, [])

  return { errors, showError, dismissError, clearAllErrors }
}

// Enhanced Error Toast Component
export function ErrorToast({ errors, onDismiss, onClearAll }: {
  errors: Array<{ id: string; error: Error; timestamp: Date; context?: string }>
  onDismiss: (id: string) => void
  onClearAll?: () => void
}) {
  if (errors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.length > 1 && onClearAll && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
          >
            Clear All ({errors.length})
          </button>
        </div>
      )}

      {errors.map(({ id, error, timestamp, context }) => (
        <Alert key={id} variant="destructive" className="shadow-lg border-l-4 border-l-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm mb-1">
                {context || 'Error'}
              </div>
              <div className="text-sm break-words">
                {error.message}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {timestamp.toLocaleTimeString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(id)}
              className="h-auto p-1 ml-2 flex-shrink-0 hover:bg-destructive/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

// Enhanced error boundary with popup notifications
export class EnhancedErrorBoundary extends React.Component<{
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showError?: (error: Error | string, context?: string) => void
}> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Enhanced Error Boundary caught an error:', error, errorInfo)

    // Show error popup if handler provided
    if (this.props.showError) {
      this.props.showError(error, 'Application Error')
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. The error has been logged and reported.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
