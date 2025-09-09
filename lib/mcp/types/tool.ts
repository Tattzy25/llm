export type MCPParameterType = 'string' | 'number' | 'object' | 'boolean'

export interface MCPToolParameter {
  type: MCPParameterType
  description?: string
  required?: boolean
  default?: unknown
}

export interface MCPTool {
  name: string
  description: string
  category: string
  serverId: string
  parameters: Record<string, MCPToolParameter>
  handler: (params: Record<string, unknown>) => Promise<unknown>
}
