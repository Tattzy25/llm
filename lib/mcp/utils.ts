"use client"

/**
 * MCP (Model Context Protocol) Utilities
 *
 * Common utility functions for MCP operations, error handling, and data processing.
 */

import type { MCPExecutionResult, MCPHealthStatus } from './types'

// Error handling utilities
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public serverId?: string,
    public toolName?: string
  ) {
    super(message)
    this.name = 'MCPError'
  }
}

// Result wrapper for MCP operations
export const createResult = <T>(
  success: boolean,
  data?: T,
  error?: string
): MCPExecutionResult => ({
  success,
  data,
  error,
  executionTime: Date.now()
})

// Health check utilities
export const createHealthStatus = (
  serverId: string,
  status: MCPHealthStatus['status'],
  responseTime?: number,
  error?: string
): MCPHealthStatus => ({
  serverId,
  status,
  lastChecked: new Date(),
  responseTime,
  error
})

// Connection utilities
export const isValidWebSocketUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
  } catch {
    return false
  }
}

export const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Data validation utilities
export const validateToolParameters = (
  params: Record<string, unknown>,
  schema: Record<string, { required?: boolean; type: string }>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  for (const [key, config] of Object.entries(schema)) {
    if (config.required && !(key in params)) {
      errors.push(`Missing required parameter: ${key}`)
    }

    if (key in params) {
      const value = params[key]
      const expectedType = config.type

      if (expectedType === 'string' && typeof value !== 'string') {
        errors.push(`Parameter ${key} must be a string`)
      } else if (expectedType === 'number' && typeof value !== 'number') {
        errors.push(`Parameter ${key} must be a number`)
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Parameter ${key} must be a boolean`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Retry utilities
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  throw lastError!
}

// Timeout utilities
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ])
}

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

// WebSocket connection helpers
export const createWebSocketConnection = (
  url: string,
  onMessage?: (data: unknown) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket => {
  const ws = new WebSocket(url)

  if (onMessage) {
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
  }

  if (onError) {
    ws.onerror = onError
  }

  if (onClose) {
    ws.onclose = onClose
  }

  return ws
}
