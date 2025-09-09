"use client"

/**
 * MCP Server Lifecycle Manager
 *
 * Handles server startup, shutdown, and lifecycle management.
 * PRODUCTION READY - ENHANCED ERROR HANDLING
 */

import type { MCPExecutionResult } from '../types'
import { getMCPConfig } from '../config'
import { MCPClient } from '../client'
import { createResult } from '../utils'

export class ServerLifecycleManager {
  private client: MCPClient
  private config: ReturnType<typeof getMCPConfig>
  private activeServers: Set<string> = new Set()

  constructor(client: MCPClient) {
    this.client = client
    this.config = getMCPConfig()
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
      const endpoint = serverConfig.httpUrl?.replace('http://', 'ws://').replace('https://', 'wss://')
      if (!endpoint) {
        return createResult(false, undefined, `Invalid server configuration for ${serverId}`)
      }

      const connected = await this.client.connect(serverId, endpoint)
      if (!connected) {
        return createResult(false, undefined, `Failed to connect to ${serverId}`)
      }

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
   * Stop all servers
   */
  async stopAllServers(): Promise<MCPExecutionResult[]> {
    const results: MCPExecutionResult[] = []

    for (const serverId of this.activeServers) {
      const result = await this.stopServer(serverId)
      results.push(result)
    }

    return results
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
        const allStatuses: Record<string, { active: boolean; config: { httpUrl?: string; endpoint?: string } | null }> = {}
        const servers = Object.keys(this.config) as (keyof typeof this.config)[]

        for (const serverKey of servers) {
          const serverConfig = this.config[serverKey]
          if (serverConfig && typeof serverConfig === 'object' && 'httpUrl' in serverConfig) {
            allStatuses[serverKey] = {
              active: this.activeServers.has(serverKey),
              config: { httpUrl: serverConfig.httpUrl, endpoint: serverConfig.endpoint }
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
   * Check if server is active
   */
  isServerActive(serverId: string): boolean {
    return this.activeServers.has(serverId)
  }

  /**
   * Get active servers
   */
  getActiveServers(): string[] {
    return Array.from(this.activeServers)
  }

  /**
   * Get server configuration
   */
  private getServerConfig(serverId: string): { httpUrl?: string; endpoint?: string } | null {
    const servers = Object.keys(this.config) as (keyof typeof this.config)[]
    for (const serverKey of servers) {
      if (serverKey === serverId) {
        const serverConfig = this.config[serverKey]
        if (serverConfig && typeof serverConfig === 'object' && 'httpUrl' in serverConfig) {
          return {
            httpUrl: serverConfig.httpUrl,
            endpoint: serverConfig.endpoint
          }
        }
      }
    }
    return null
  }
}
