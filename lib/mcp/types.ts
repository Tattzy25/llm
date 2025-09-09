"use client"

/**
 * MCP (Model Context Protocol) Types and Interfaces
 *
 * Core type definitions for MCP server and client functionality.
 */

export interface MCPServer {
  id: string
  name: string
  endpoint: string
  tools: MCPTool[]
  connected: boolean
  lastConnected?: Date
  status?: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
}

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

export interface MCPConnection {
  serverId: string
  websocket?: WebSocket
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectInterval: number
}

export interface MCPExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  executionTime?: number
  toolName?: string
  serverId?: string
}

export interface MCPHealthStatus {
  serverId: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  lastChecked: Date
  responseTime?: number
  error?: string
}

export interface MCPConfig {
  endpoint?: string
  httpUrl?: string
  timeout?: number
  retries?: number
}
