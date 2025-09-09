"use client"

/**
 * MCP (Model Context Protocol) Manager
 *
 * Central coordinator for MCP servers and tools.
 * Handles server lifecycle, tool execution, and system monitoring.
 */

import type { MCPTool, MCPExecutionResult } from './types'
import { getMCPConfig } from './config'
import { MCPClient } from './client'
import { ALL_MCP_TOOLS, getToolsByServer } from './tools'
import { createResult } from './utils'

export class MCPManager {
  private client: MCPClient
  private config: ReturnType<typeof getMCPConfig>
  private activeServers: Set<string> = new Set()
  private toolCache: Map<string, MCPTool> = new Map()

  constructor() {
    this.config = getMCPConfig()
    this.client = new MCPClient()
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
    const results: MCPExecutionResult[] = []
    const servers = Object.keys(this.config) as (keyof typeof this.config)[]

    for (const serverKey of servers) {
      const serverConfig = this.config[serverKey]
      if (serverConfig && typeof serverConfig === 'object' && 'httpUrl' in serverConfig) {
        try {
          const result = await this.startServer(serverKey)
          results.push(result)
        } catch (error) {
          results.push(createResult(false, undefined, `Failed to start ${serverKey}: ${error}`))
        }
      }
    }

    return results
  }

  /**
   * Start a specific MCP server
   */
  async startServer(serverId: string): Promise<MCPExecutionResult> {
    try {
      const serverConfig = this.getServerConfig(serverId)
      if (!serverConfig) {
        return createResult(false, undefined, `Server configuration not found: ${serverId}`)
      }

      // Connect to server
      const endpoint = serverConfig.httpUrl.replace('http://', 'ws://').replace('https://', 'wss://')
      await this.client.connect(serverId, endpoint)

      // Verify server is responding
      const healthCheck = await this.client.executeTool(serverId, 'health_check', {})
      if (healthCheck.success) {
        this.activeServers.add(serverId)
        console.log(`Server ${serverId} started successfully`)
        return createResult(true, `Server ${serverId} started successfully`)
      } else {
        return createResult(false, undefined, `Server ${serverId} health check failed`)
      }
    } catch (error) {
      console.error(`Failed to start server ${serverId}:`, error)
      return createResult(false, undefined, `Failed to start server ${serverId}: ${error}`)
    }
  }

  /**
   * Stop a specific MCP server
   */
  async stopServer(serverId: string): Promise<MCPExecutionResult> {
    try {
      await this.client.disconnect(serverId)
      this.activeServers.delete(serverId)
      console.log(`Server ${serverId} stopped successfully`)
      return createResult(true, `Server ${serverId} stopped successfully`)
    } catch (error) {
      console.error(`Failed to stop server ${serverId}:`, error)
      return createResult(false, undefined, `Failed to stop server ${serverId}: ${error}`)
    }
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
      if (!tool.serverId || !this.activeServers.has(tool.serverId)) {
        if (!tool.serverId) {
          return createResult(false, undefined, 'Tool has no server ID')
        }
        const startResult = await this.startServer(tool.serverId)
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
   * Get server status
   */
  async getServerStatus(serverId?: string): Promise<MCPExecutionResult> {
    try {
      if (serverId) {
        const isActive = this.activeServers.has(serverId)
        const config = this.getServerConfig(serverId)

        return createResult(true, {
          serverId,
          active: isActive,
          config: config
        })
      } else {
        // Get status for all servers
        const allStatuses: Record<string, { active: boolean; config: { httpUrl: string; endpoint: string } | null }> = {}
        const servers = Object.keys(this.config) as (keyof typeof this.config)[]

        for (const serverKey of servers) {
          const serverConfig = this.config[serverKey]
          if (serverConfig && typeof serverConfig === 'object' && 'httpUrl' in serverConfig && 'endpoint' in serverConfig) {
            allStatuses[serverKey] = {
              active: this.activeServers.has(serverKey),
              config: { httpUrl: serverConfig.httpUrl || '', endpoint: serverConfig.endpoint || '' }
            }
          } else {
            allStatuses[serverKey] = {
              active: false,
              config: null
            }
          }
        }

        return createResult(true, allStatuses)
      }
    } catch (error) {
      return createResult(false, undefined, `Failed to get server status: ${error}`)
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
        activeServers: this.activeServers.size,
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
            const status = await this.client.executeTool(serverId, 'health_check', {})
            health.servers[serverId] = {
              active: this.activeServers.has(serverId),
              healthy: status.success,
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
   * Get server configuration
   */
  private getServerConfig(serverId: string): { httpUrl: string; endpoint: string } | null {
    const servers = Object.keys(this.config) as (keyof typeof this.config)[]
    for (const serverKey of servers) {
      if (serverKey === serverId) {
        const serverConfig = this.config[serverKey]
        if (serverConfig && typeof serverConfig === 'object' && 'httpUrl' in serverConfig) {
          return {
            httpUrl: serverConfig.httpUrl as string,
            endpoint: serverConfig.endpoint as string
          }
        }
      }
    }
    return null
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    for (const serverId of this.activeServers) {
      await this.stopServer(serverId)
    }
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
