"use client"

/**
 * MCP Servers Hook
 *
 * Hook for managing MCP server connections and status.
 */

import { useState, useEffect, useCallback } from 'react'
import type { MCPConnection, MCPHealthStatus } from '../types'
import { mcpClient } from '../client'
import { getMCPManager } from '../manager'

interface UseMCPServersReturn {
  connections: MCPConnection[]
  healthStatuses: MCPHealthStatus[]
  isLoading: boolean
  error: string | null
  startServer: (serverId: string) => Promise<boolean>
  stopServer: (serverId: string) => Promise<boolean>
  refreshStatus: () => void
}

export const useMCPServers = (): UseMCPServersReturn => {
  const [connections, setConnections] = useState<MCPConnection[]>([])
  const [healthStatuses, setHealthStatuses] = useState<MCPHealthStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshStatus = useCallback(() => {
    setConnections(mcpClient.getConnections())
    setHealthStatuses(mcpClient.getAllHealthStatuses())
  }, [])

  useEffect(() => {
    refreshStatus()

    // Set up periodic updates
    const interval = setInterval(refreshStatus, 10000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  const startServer = useCallback(async (serverId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getMCPManager().startServer(serverId)
      refreshStatus()
      return result.success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start server'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  const stopServer = useCallback(async (serverId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getMCPManager().stopServer(serverId)
      refreshStatus()
      return result.success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop server'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  return {
    connections,
    healthStatuses,
    isLoading,
    error,
    startServer,
    stopServer,
    refreshStatus
  }
}
