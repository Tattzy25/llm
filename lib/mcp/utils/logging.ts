"use client"

/**
 * MCP Logging Utilities
 *
 * Centralized logging for MCP operations.
 */

// Logging utilities
export const createLogger = (prefix: string) => ({
  info: (message: string, ...args: unknown[]) =>
    console.log(`[${prefix}] ${message}`, ...args),

  error: (message: string, error?: Error, ...args: unknown[]) =>
    console.error(`[${prefix}] ${message}`, error?.message || '', ...args),

  warn: (message: string, ...args: unknown[]) =>
    console.warn(`[${prefix}] ${message}`, ...args),

  debug: (message: string, ...args: unknown[]) =>
    console.debug(`[${prefix}] ${message}`, ...args)
})

// Performance monitoring
export const measureExecutionTime = async <T>(
  operation: () => Promise<T>
): Promise<{ result: T; executionTime: number }> => {
  const startTime = Date.now()
  const result = await operation()
  const executionTime = Date.now() - startTime

  return { result, executionTime }
}
