"use client"

/**
 * MCP Validation Utilities
 *
 * Data validation and parameter checking utilities.
 */

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
        errors.push(`Parameter ${key} must be a string, got ${typeof value}`)
      } else if (expectedType === 'number' && typeof value !== 'number') {
        errors.push(`Parameter ${key} must be a number, got ${typeof value}`)
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Parameter ${key} must be a boolean, got ${typeof value}`)
      } else if (expectedType === 'object' && (typeof value !== 'object' || value === null)) {
        errors.push(`Parameter ${key} must be an object, got ${typeof value}`)
      } else if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(`Parameter ${key} must be an array, got ${typeof value}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

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
