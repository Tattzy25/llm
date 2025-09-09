"use client"

/**
 * MCP Health Hook
 *
 * Hook for monitoring MCP server health and system status.
 */

import { useState, useEffect, useCallback } from 'react'
import type { MCPHealthStatus, MCPExecutionResult } from '../types'
import { mcpClient } from '../client/index'
import { getMCPManager } from '../manager'

interface UseMCPHealthReturn {
  healthStatuses: MCPHealthStatus[]
  systemHealth: MCPExecutionResult | null
  isLoading: boolean
  error: string | null
  checkHealth: (serverId: string) => Promise<MCPHealthStatus>
  getSystemHealth: () => Promise<MCPExecutionResult>
  refreshHealth: () => void
  getHealthSummary: () => {
    total: number
    healthy: number
    unhealthy: number
    unknown: number
    averageResponseTime: number
  }
}

export const useMCPHealth = (): UseMCPHealthReturn => {
  const [healthStatuses, setHealthStatuses] = useState<MCPHealthStatus[]>([])
  const [systemHealth, setSystemHealth] = useState<MCPExecutionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshHealth = useCallback(() => {
    setHealthStatuses(mcpClient.getAllHealthStatuses())
  }, [])

  useEffect(() => {
    refreshHealth()

    // Set up periodic health checks
    const interval = setInterval(refreshHealth, 15000)
    return () => clearInterval(interval)
  }, [refreshHealth])

  const checkHealth = useCallback(async (serverId: string): Promise<MCPHealthStatus> => {
    setIsLoading(true)
    setError(null)
    try {
      const status = await mcpClient.checkHealth(serverId)
      refreshHealth()
      return status
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check health'
      setError(errorMessage)
      return {
        serverId,
        status: 'unknown',
        lastChecked: new Date(),
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [refreshHealth])

  const getSystemHealth = useCallback(async (): Promise<MCPExecutionResult> => {
    setIsLoading(true)
    setError(null)
    try {
      const health = await getMCPManager().getSystemHealth()
      setSystemHealth(health)
      return health
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get system health'
      setError(errorMessage)
      const errorResult = {
        success: false,
        error: errorMessage
      }
      setSystemHealth(errorResult)
      return errorResult
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getHealthSummary = useCallback(() => {
    const summary = mcpClient.getHealthSummary()
    return summary
  }, [])

  return {
    healthStatuses,
    systemHealth,
    isLoading,
    error,
    checkHealth,
    getSystemHealth,
    refreshHealth,
    getHealthSummary
  }
}
