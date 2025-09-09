"use client"

/**
 * MCP Client - Main Module
 *
 * Unified interface for MCP client functionality.
 * Combines connection management, tool execution, health monitoring, and WebSocket handling.
 */

import type { MCPExecutionResult } from '../types'
import type { MCPConnection, MCPHealthStatus } from '../types/server'
import { getMCPConfig, MCP_SETTINGS } from '../config'
import { createLogger, validateToolParameters } from '../utils/index'
import { getToolByName } from '../tools/index'
import { ConnectionManager } from './connection-manager'
import { ToolExecutor } from './tool-executor'
import { HealthMonitor } from './health-monitor'

const logger = createLogger('MCP-Client')

export class MCPClient {
  private connectionManager: ConnectionManager
  private toolExecutor: ToolExecutor
  private healthMonitor: HealthMonitor

  constructor() {
    this.connectionManager = new ConnectionManager()
    this.toolExecutor = new ToolExecutor()
    this.healthMonitor = new HealthMonitor()

    if (MCP_SETTINGS.ENABLE_HEALTH_CHECKS) {
      this.startHealthChecks()
    }
  }

  /**
   * Connect to an MCP server - PRODUCTION READY - NO FALLBACKS
   */
  async connect(serverId: string, endpoint?: string): Promise<boolean> {
    try {
      // PRODUCTION: Validate endpoint exists
      if (!endpoint) {
        const error = new Error(`MCP server endpoint for ${serverId} is not configured. Please set the appropriate environment variable.`)
        logger.error(`Missing endpoint configuration for server: ${serverId}`, error)
        return false
      }

      return await this.connectionManager.connect(serverId, endpoint)
    } catch (error) {
      const errorMessage = `Connection setup failed for ${serverId}: ${(error as Error).message}`
      logger.error(`Connection error for server ${serverId}`, new Error(errorMessage))
      return false
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverId: string): Promise<void> {
    await this.connectionManager.disconnect(serverId)
    this.healthMonitor.clearHealthStatus(serverId)
  }

  /**
   * Execute a tool on an MCP server
   */
  async executeTool(
    serverId: string,
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<MCPExecutionResult> {
    const serverConfig = this.getServerConfig(serverId)

    if (!serverConfig) {
      return {
        success: false,
        error: `Unknown server: ${serverId}`,
        toolName,
        serverId
      }
    }

    // Validate parameters against tool schema
    const tool = getToolByName(toolName)
    if (tool && tool.parameters) {
      const validation = validateToolParameters(parameters, tool.parameters)
      if (!validation.valid) {
        return {
          success: false,
          error: `Parameter validation failed: ${validation.errors.join(', ')}`,
          toolName,
          serverId
        }
      }
    }

    if (!serverConfig.httpUrl) {
      return {
        success: false,
        error: `Server ${serverId} HTTP URL is not configured`,
        toolName,
        serverId
      }
    }

    return await this.toolExecutor.executeTool(
      serverId,
      toolName,
      parameters,
      serverConfig.httpUrl,
      serverConfig.timeout,
      serverConfig.retries
    )
  }

  /**
   * Send a message via WebSocket
   */
  async sendMessage(serverId: string, message: unknown): Promise<boolean> {
    return await this.connectionManager.sendMessage(serverId, message)
  }

  /**
   * Check server health
   */
  async checkHealth(serverId: string): Promise<MCPHealthStatus> {
    const serverConfig = this.getServerConfig(serverId)

    if (!serverConfig) {
      return this.healthMonitor.getHealthStatus(serverId) || {
        serverId,
        status: 'unknown',
        lastChecked: new Date(),
        error: 'Unknown server'
      }
    }

    return await this.healthMonitor.checkHealth(serverId, serverConfig?.httpUrl || '')
  }

  /**
   * Get all connections
   */
  getConnections(): MCPConnection[] {
    return this.connectionManager.getAllConnections()
  }

  /**
   * Get connection by server ID
   */
  getConnection(serverId: string): MCPConnection | undefined {
    return this.connectionManager.getConnection(serverId)
  }

  /**
   * Get all health statuses
   */
  getAllHealthStatuses(): MCPHealthStatus[] {
    return this.healthMonitor.getAllHealthStatuses()
  }

  /**
   * Get health status by server ID
   */
  getHealthStatus(serverId: string): MCPHealthStatus | undefined {
    return this.healthMonitor.getHealthStatus(serverId)
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    total: number
    healthy: number
    unhealthy: number
    unknown: number
    averageResponseTime: number
  } {
    return this.healthMonitor.getHealthSummary()
  }

  /**
   * Check if server is connected
   */
  isConnected(serverId: string): boolean {
    return this.connectionManager.isConnected(serverId)
  }

  private getServerConfig(serverId: string) {
    const config = getMCPConfig()

    // PRODUCTION: Strict server ID mapping - NO FALLBACKS
    switch (serverId) {
      case 'REMOTE_SERVER':
        return config.REMOTE_SERVER.endpoint ? config.REMOTE_SERVER : null
      case 'WEB_SCRAPER':
        return config.WEB_SCRAPER.endpoint ? config.WEB_SCRAPER : null
      case 'DATABASE':
        return config.DATABASE.endpoint ? config.DATABASE : null
      case 'AI_ASSISTANT':
        return config.AI_ASSISTANT.endpoint ? config.AI_ASSISTANT : null
      case 'SERVER_MANAGER':
        return config.SERVER_MANAGER.endpoint ? config.SERVER_MANAGER : null
      default:
        return null
    }
  }

  private startHealthChecks(): void {
    const config = getMCPConfig()
    const serverIds: string[] = []
    const httpUrls = new Map<string, string>()

    // Collect configured servers
    Object.entries(config).forEach(([key, serverConfig]) => {
      if (serverConfig && typeof serverConfig === 'object' && 'httpUrl' in serverConfig && serverConfig.endpoint) {
        serverIds.push(key)
        httpUrls.set(key, serverConfig.httpUrl as string)
      }
    })

    if (serverIds.length > 0) {
      this.healthMonitor.startHealthChecks(serverIds, httpUrls, MCP_SETTINGS.HEALTH_CHECK_INTERVAL)
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.healthMonitor.cleanup()
    this.connectionManager.cleanup()
  }
}

// Global MCP client instance
export const mcpClient = new MCPClient()
