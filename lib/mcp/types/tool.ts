"use client"

/**
 * MCP Tool Types
 *
 * Type definitions for MCP tools and parameters.
 */

export interface MCPTool {
  name: string
  description: string
  parameters: Record<string, ToolParameter>
  handler: (params: Record<string, unknown>) => Promise<unknown>
  category?: string
  serverId?: string
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required?: boolean
  default?: unknown
  enum?: string[]
}
