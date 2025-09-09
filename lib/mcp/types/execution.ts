"use client"

/**
 * MCP Execution Types
 *
 * Type definitions for MCP execution results and health status.
 */

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
