import { MCPAuthError, MCPError, MCPNetworkError, MCPRateLimitError, MCPServerUnavailableError, MCPValidationError } from './utils/error-handling'

export function errorToStatus(err: unknown): number {
  const e = err as MCPError
  if (e instanceof MCPValidationError) return 400
  if (e instanceof MCPAuthError) return 401
  if (e instanceof MCPRateLimitError) return 429
  if (e instanceof MCPServerUnavailableError) return 503
  if (e instanceof MCPNetworkError) return 502
  return 500
}

type ErrorLike = Partial<MCPError> & { name?: string; code?: string; message?: string; hint?: string; context?: string }

export function errorPayload(err: unknown) {
  const e = (err as ErrorLike) || {}
  const base = {
    error: true,
    name: e.name ?? 'Error',
    code: e.code ?? 'UNKNOWN',
    message: e.message ?? 'Unexpected error',
  }
  const { hint, context } = e
  return {
    ...base,
    ...(hint ? { hint } : {}),
    ...(context ? { context } : {}),
  }
}
