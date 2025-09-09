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

export function errorPayload(err: unknown) {
  const e = err as MCPError
  const base = {
    error: true,
    name: (e as any)?.name ?? 'Error',
    code: (e as any)?.code ?? 'UNKNOWN',
    message: (e as any)?.message ?? 'Unexpected error',
  }
  const hint = (e as any)?.hint
  const context = (e as any)?.context
  return {
    ...base,
    ...(hint ? { hint } : {}),
    ...(context ? { context } : {}),
  }
}
