"use client"

/**
 * MCP Server Types
 *
 * Type definitions for MCP servers and connections.
 */

import type { MCPTool } from './tool'

export interface MCPServer {
  id: string
  name: string
  endpoint?: string
  tools: MCPTool[]
  connected: boolean
  lastConnected?: Date
  status?: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
}

export interface MCPConnection {
  serverId: string
  websocket?: WebSocket
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectInterval: number
}

export interface MCPConfig {
  endpoint?: string
  httpUrl?: string
  timeout?: number
  retries?: number
}
