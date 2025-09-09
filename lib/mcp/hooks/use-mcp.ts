"use client"

/**
 * MCP React Hook
 *
 * Main hook for MCP functionality in React components.
 * Provides access to MCP client, tools, and server management.
 */

import { useState, useEffect, useCallback } from 'react'
import type { MCPTool, MCPExecutionResult, MCPHealthStatus, MCPConnection } from '../types'
import { getMCPManager } from '../manager'
import { mcpClient } from '../client'

interface UseMCPReturn {
  // Server management
  servers: MCPConnection[]
  startServer: (serverId: string) => Promise<MCPExecutionResult>
  stopServer: (serverId: string) => Promise<MCPExecutionResult>
  getServerStatus: (serverId?: string) => Promise<MCPExecutionResult>

  // Tool management
  tools: MCPTool[]
  getAvailableTools: (serverId?: string) => MCPTool[]
  executeTool: (toolName: string, parameters: Record<string, unknown>) => Promise<MCPExecutionResult>

  // Health monitoring
  healthStatuses: MCPHealthStatus[]
  getHealthStatus: (serverId: string) => MCPHealthStatus | undefined
  checkHealth: (serverId: string) => Promise<MCPHealthStatus>

  // Connection management
  connections: MCPConnection[]
  isConnected: (serverId: string) => boolean

  // System health
  getSystemHealth: () => Promise<MCPExecutionResult>

  // Loading states
  isLoading: boolean
  error: string | null
}

export const useMCP = (): UseMCPReturn => {
  const [tools] = useState<MCPTool[]>(() => getMCPManager().getAvailableTools())
  const [healthStatuses, setHealthStatuses] = useState<MCPHealthStatus[]>([])
  const [connections, setConnections] = useState<MCPConnection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update connections and health statuses
  const updateStatus = useCallback(() => {
    setConnections(mcpClient.getConnections())
    setHealthStatuses(mcpClient.getAllHealthStatuses())
  }, [])

  // Initialize
  useEffect(() => {
    updateStatus()

    // Set up periodic updates
    const interval = setInterval(updateStatus, 5000)
    return () => clearInterval(interval)
  }, [updateStatus])

  // Server management functions
  const startServer = useCallback(async (serverId: string): Promise<MCPExecutionResult> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getMCPManager().startServer(serverId)
      updateStatus()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start server'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
        serverId
      }
    } finally {
      setIsLoading(false)
    }
  }, [updateStatus])

  const stopServer = useCallback(async (serverId: string): Promise<MCPExecutionResult> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getMCPManager().stopServer(serverId)
      updateStatus()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop server'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
        serverId
      }
    } finally {
      setIsLoading(false)
    }
  }, [updateStatus])

  const getServerStatus = useCallback(async (serverId?: string): Promise<MCPExecutionResult> => {
    try {
      return await getMCPManager().getServerStatus(serverId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get server status'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [])

  // Tool functions
  const getAvailableTools = useCallback((serverId?: string): MCPTool[] => {
    return getMCPManager().getAvailableTools(serverId)
  }, [])

  const executeTool = useCallback(async (
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<MCPExecutionResult> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getMCPManager().executeTool(toolName, parameters)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute tool'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
        toolName
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Health functions
  const getHealthStatus = useCallback((serverId: string): MCPHealthStatus | undefined => {
    return mcpClient.getHealthStatus(serverId)
  }, [])

  const checkHealth = useCallback(async (serverId: string): Promise<MCPHealthStatus> => {
    try {
      return await mcpClient.checkHealth(serverId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check health'
      setError(errorMessage)
      return {
        serverId,
        status: 'unknown',
        lastChecked: new Date(),
        error: errorMessage
      }
    }
  }, [])

  // Connection functions
  const isConnected = useCallback((serverId: string): boolean => {
    const connection = mcpClient.getConnection(serverId)
    return connection?.websocket?.readyState === WebSocket.OPEN
  }, [])

  // System health
  const getSystemHealth = useCallback(async (): Promise<MCPExecutionResult> => {
    try {
      return await getMCPManager().getSystemHealth()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get system health'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [])

  return {
    servers: connections, // Use connections as servers
    startServer,
    stopServer,
    getServerStatus,
    tools,
    getAvailableTools,
    executeTool,
    healthStatuses,
    getHealthStatus,
    checkHealth,
    connections,
    isConnected,
    getSystemHealth,
    isLoading,
    error
  }
}
