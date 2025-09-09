export interface MCPExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  executionTime?: number
}

// Back-compat alias used in components
export type ToolParameter = import('./tool').MCPToolParameter
