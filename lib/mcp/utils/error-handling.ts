// isomorphic module: safe for server and client imports

/**
 * MCP Error Utilities
 *
 * Strongly-typed error classes and helpers for consistent handling
 * across UI and API layers. No silent fallbacks — errors are explicit.
 */

export type MCPErrorSeverity = "info" | "warning" | "error" | "critical"

export interface MCPErrorOptions {
  code: string
  cause?: unknown
  context?: string
  hint?: string
  severity?: MCPErrorSeverity
}

export class MCPError extends Error {
  readonly code: string
  readonly cause?: unknown
  readonly context?: string
  readonly hint?: string
  readonly severity: MCPErrorSeverity

  constructor(message: string, opts: MCPErrorOptions) {
    super(message)
    this.name = this.constructor.name
    this.code = opts.code
    this.cause = opts.cause
    this.context = opts.context
    this.hint = opts.hint
    this.severity = opts.severity ?? "error"
  }
}

export class MCPServerUnavailableError extends MCPError {
  readonly serverId: string
  constructor(serverId: string, message?: string, opts: Partial<MCPErrorOptions> = {}) {
    super(message ?? `MCP server '${serverId}' is unavailable.`, {
      code: opts.code ?? "MCP_SERVER_UNAVAILABLE",
      cause: opts.cause,
      context: opts.context ?? serverId,
      hint: opts.hint ?? "Verify server status, URL, and credentials.",
      severity: opts.severity ?? "error",
    })
    this.serverId = serverId
  }
}

export class MCPToolExecutionError extends MCPError {
  readonly serverId?: string
  readonly toolName?: string
  constructor(message: string, opts: Partial<MCPErrorOptions> & { serverId?: string; toolName?: string } = {}) {
    super(message, {
      code: opts.code ?? "MCP_TOOL_EXECUTION_FAILED",
      cause: opts.cause,
      context: opts.context ?? (([opts.serverId, opts.toolName].filter(Boolean).join(":")) || undefined),
      hint: opts.hint,
      severity: opts.severity ?? "error",
    })
    this.serverId = opts.serverId
    this.toolName = opts.toolName
  }
}

export class MCPValidationError extends MCPError {
  constructor(message: string, opts: Partial<MCPErrorOptions> = {}) {
    super(message, {
      code: opts.code ?? "MCP_VALIDATION_ERROR",
      cause: opts.cause,
      context: opts.context,
      hint: opts.hint,
      severity: opts.severity ?? "warning",
    })
  }
}

export class MCPAuthError extends MCPError {
  constructor(message: string, opts: Partial<MCPErrorOptions> = {}) {
    super(message, {
      code: opts.code ?? "MCP_AUTH_ERROR",
      cause: opts.cause,
      context: opts.context,
      hint: opts.hint ?? "Login again or verify auth configuration.",
      severity: opts.severity ?? "error",
    })
  }
}

export class MCPRateLimitError extends MCPError {
  constructor(message = "Rate limit exceeded.", opts: Partial<MCPErrorOptions> = {}) {
    super(message, {
      code: opts.code ?? "MCP_RATE_LIMITED",
      cause: opts.cause,
      context: opts.context,
      hint: opts.hint ?? "Please wait and try again.",
      severity: opts.severity ?? "warning",
    })
  }
}

export class MCPNetworkError extends MCPError {
  constructor(message: string, opts: Partial<MCPErrorOptions> = {}) {
    super(message, {
      code: opts.code ?? "MCP_NETWORK_ERROR",
      cause: opts.cause,
      context: opts.context,
      hint: opts.hint ?? "Check your connection and server reachability.",
      severity: opts.severity ?? "error",
    })
  }
}

export function normalizeToMCPError(err: unknown, defaults: Partial<MCPErrorOptions> = {}): MCPError {
  if (err instanceof MCPError) return err
  const e = err instanceof Error ? err : new Error(String(err))
  // Heuristic mapping
  if (/fetch|network|timeout|ECONN/i.test(e.message)) {
    return new MCPNetworkError(e.message, { ...defaults, cause: e })
  }
  if (/auth|token|unauthorized|forbidden/i.test(e.message)) {
    return new MCPAuthError(e.message, { ...defaults, cause: e })
  }
  if (/rate|quota|429/i.test(e.message)) {
    return new MCPRateLimitError("Rate limit exceeded.", { ...defaults, cause: e })
  }
  return new MCPError(e.message || "Unexpected error.", {
    code: defaults.code ?? "MCP_UNKNOWN_ERROR",
    cause: e,
    context: defaults.context,
    hint: defaults.hint,
    severity: defaults.severity ?? "error",
  })
}

export function toUserMessage(err: MCPError | unknown): string {
  const e = normalizeToMCPError(err)
  // Prefer explicit message; append hint if useful
  return e.hint ? `${e.message} — ${e.hint}` : e.message
}

// Wrap a tool handler to ensure typed errors and no silent fallbacks
export function withMCPErrorHandling<TParams extends Record<string, unknown>, TResult>(
  fn: (params: TParams) => Promise<TResult>,
  context?: string,
) {
  return async (params: TParams): Promise<TResult> => {
    try {
      return await fn(params)
    } catch (err) {
      const wrapped = normalizeToMCPError(err, { context })
      // Re-throw so UI boundaries and notifiers can display it
      throw wrapped
    }
  }
}

// Assertion helper that throws MCPValidationError
export function assert(condition: unknown, message: string, opts: Partial<MCPErrorOptions> = {}): asserts condition {
  if (!condition) {
    throw new MCPValidationError(message, opts)
  }
}
