"use client"

import * as React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { subscribeErrors, dismissError, clearAll, type ErrorItem } from '@/lib/error-bus'

export function GlobalErrorToaster() {
  const [items, setItems] = React.useState<ErrorItem[]>([])

  React.useEffect(() => {
    return subscribeErrors(setItems)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {items.length > 1 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => clearAll()}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
          >
            Clear All ({items.length})
          </button>
        </div>
      )}

      {items.map(({ id, error, timestamp, context }) => (
        <Alert key={id} variant="destructive" className="shadow-lg border-l-4 border-l-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm mb-1">
                {context || error.code || 'Error'}
              </div>
              <div className="text-sm break-words">
                {error.message}
              </div>
              {error.hint && (
                <div className="text-xs text-muted-foreground mt-1">{error.hint}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {timestamp.toLocaleTimeString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissError(id)}
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
