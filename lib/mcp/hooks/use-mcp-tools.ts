"use client"

/**
 * MCP Tools Hook
 *
 * Hook for managing MCP tool execution and status.
 */

import { useState, useCallback } from 'react'
import type { MCPTool, MCPExecutionResult } from '../types'
import { getMCPManager } from '../manager'

interface UseMCPToolsReturn {
  tools: MCPTool[]
  isLoading: boolean
  error: string | null
  executeTool: (toolName: string, parameters: Record<string, unknown>) => Promise<MCPExecutionResult>
  getToolsByCategory: (category: string) => MCPTool[]
  getToolsByServer: (serverId: string) => MCPTool[]
}

export const useMCPTools = (): UseMCPToolsReturn => {
  const [tools] = useState<MCPTool[]>(() => getMCPManager().getAvailableTools())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const getToolsByCategory = useCallback((category: string): MCPTool[] => {
    return tools.filter(tool => tool.category === category)
  }, [tools])

  const getToolsByServer = useCallback((serverId: string): MCPTool[] => {
    return tools.filter(tool => tool.serverId === serverId)
  }, [tools])

  return {
    tools,
    isLoading,
    error,
    executeTool,
    getToolsByCategory,
    getToolsByServer
  }
}
