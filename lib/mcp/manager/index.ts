"use client"

/**
 * MCP Manager - Main Module
 *
 * Central coordinator for MCP servers and tools.
 * Handles server lifecycle, tool execution, and system monitoring.
 */

import type { MCPTool, MCPExecutionResult } from '../types'
import { getMCPConfig } from '../config'
import { MCPClient } from '../client'
import { ALL_MCP_TOOLS, getToolsByServer } from '../tools/index'
import { createResult } from '../utils'
import { ServerLifecycleManager } from './server-lifecycle'

export class MCPManager {
  private client: MCPClient
  private lifecycleManager: ServerLifecycleManager
  private config: ReturnType<typeof getMCPConfig>
  private toolCache: Map<string, MCPTool> = new Map()

  constructor() {
    this.config = getMCPConfig()
    this.client = new MCPClient()
    this.lifecycleManager = new ServerLifecycleManager(this.client)
    this.initializeToolCache()
  }

  /**
   * Initialize tool cache for faster lookups
   */
  private initializeToolCache(): void {
    ALL_MCP_TOOLS.forEach(tool => {
      this.toolCache.set(tool.name, tool)
    })
  }

  /**
   * Start all MCP servers
   */
  async startAllServers(): Promise<MCPExecutionResult[]> {
    return await this.lifecycleManager.startAllServers()
  }

  /**
   * Start a specific MCP server
   */
  async startServer(serverId: string): Promise<MCPExecutionResult> {
    return await this.lifecycleManager.startServer(serverId)
  }

  /**
   * Stop a specific MCP server
   */
  async stopServer(serverId: string): Promise<MCPExecutionResult> {
    return await this.lifecycleManager.stopServer(serverId)
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, parameters: Record<string, unknown>): Promise<MCPExecutionResult> {
    try {
      const tool = this.toolCache.get(toolName)
      if (!tool) {
        return createResult(false, undefined, `Tool not found: ${toolName}`)
      }

      // Check if server is active
      if (!tool.serverId || !this.lifecycleManager.isServerActive(tool.serverId)) {
        if (!tool.serverId) {
          return createResult(false, undefined, 'Tool has no server ID')
        }
        const startResult = await this.lifecycleManager.startServer(tool.serverId)
        if (!startResult.success) {
          return createResult(false, undefined, `Server ${tool.serverId} is not available`)
        }
      }

      // Execute the tool
      const result = await this.client.executeTool(tool.serverId!, toolName, parameters)
      console.log(`Tool ${toolName} executed successfully`)
      return result
    } catch (error) {
      console.error(`Tool execution failed:`, error)
      return createResult(false, undefined, `Tool execution failed: ${error}`)
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools(serverId?: string): MCPTool[] {
    if (serverId) {
      return getToolsByServer(serverId)
    }
    return ALL_MCP_TOOLS
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<MCPExecutionResult> {
    try {
      const health = {
        totalServers: Object.keys(this.config).length,
        activeServers: this.lifecycleManager.getActiveServers().length,
        totalTools: ALL_MCP_TOOLS.length,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        servers: {} as Record<string, { active: boolean; healthy: boolean; tools: number }>
      }

      // Get individual server health
      const servers = Object.keys(this.config) as (keyof typeof this.config)[]
      for (const serverId of servers) {
        const serverConfig = this.config[serverId]
        if (serverConfig && typeof serverConfig === 'object' && 'httpUrl' in serverConfig) {
          try {
            const status = await this.client.checkHealth(serverId)
            health.servers[serverId] = {
              active: this.lifecycleManager.isServerActive(serverId),
              healthy: status.status === 'healthy',
              tools: getToolsByServer(serverId).length
            }
          } catch {
            health.servers[serverId] = {
              active: false,
              healthy: false,
              tools: getToolsByServer(serverId).length
            }
          }
        }
      }

      return createResult(true, health)
    } catch (error) {
      return createResult(false, undefined, `Failed to get system health: ${error}`)
    }
  }

  /**
   * Get server status
   */
  async getServerStatus(serverId?: string): Promise<MCPExecutionResult> {
    return await this.lifecycleManager.getServerStatus(serverId)
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.lifecycleManager.stopAllServers()
    // Note: MCPClient doesn't have a cleanup method, so we just stop servers
  }
}

// Singleton instance
let mcpManagerInstance: MCPManager | null = null

export const getMCPManager = (): MCPManager => {
  if (!mcpManagerInstance) {
    mcpManagerInstance = new MCPManager()
  }
  return mcpManagerInstance
}

// Convenience functions
export const startMCPServers = () => getMCPManager().startAllServers()
export const executeMCPTool = (toolName: string, parameters: Record<string, unknown>) =>
  getMCPManager().executeTool(toolName, parameters)
export const getMCPServerStatus = (serverId?: string) =>
  getMCPManager().getServerStatus(serverId)
export const getMCPSystemHealth = () => getMCPManager().getSystemHealth()
export const getMCPTools = (serverId?: string) =>
  getMCPManager().getAvailableTools(serverId)
