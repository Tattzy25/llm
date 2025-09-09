export interface MCPExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  executionTime?: number
  toolName?: string
  serverId?: string
}

// Back-compat alias used in components
export type ToolParameter = import('./tool').MCPToolParameter
