"use client"

/**
 * MCP (Model Context Protocol) Client
 *
 * Handles WebSocket connections, HTTP requests, and communication with MCP servers.
 */

import type { MCPConnection, MCPExecutionResult, MCPHealthStatus } from './types'
import { MCP_SETTINGS, getMCPConfig } from './config'
import { createLogger, withRetry, withTimeout, createHealthStatus, MCPError } from './utils'

const logger = createLogger('MCP-Client')

export class MCPClient {
  private connections: Map<string, MCPConnection> = new Map()
  private healthStatuses: Map<string, MCPHealthStatus> = new Map()
  private healthCheckInterval?: NodeJS.Timeout

  constructor() {
    if (MCP_SETTINGS.ENABLE_HEALTH_CHECKS) {
      this.startHealthChecks()
    }
  }

  // Connect to an MCP server - PRODUCTION READY - NO FALLBACKS
  async connect(serverId: string, endpoint?: string): Promise<boolean> {
    try {
      // PRODUCTION: Validate endpoint exists
      if (!endpoint) {
        const error = new Error(`MCP server endpoint for ${serverId} is not configured. Please set the appropriate environment variable.`)
        logger.error(`Missing endpoint configuration for server: ${serverId}`, error)
        this.updateHealthStatus(serverId, 'unhealthy', undefined, error.message)
        return false
      }

      if (this.connections.has(serverId)) {
        await this.disconnect(serverId)
      }

      const connection: MCPConnection = {
        serverId,
        reconnectAttempts: 0,
        maxReconnectAttempts: 0, // NO RECONNECTS - PRODUCTION READY
        reconnectInterval: MCP_SETTINGS.RECONNECT_INTERVAL
      }

      const ws = new WebSocket(endpoint)

      return new Promise((resolve) => {
        ws.onopen = () => {
          connection.websocket = ws
          this.connections.set(serverId, connection)
          this.updateHealthStatus(serverId, 'healthy')
          logger.info(`Connected to MCP server: ${serverId}`)
          resolve(true)
        }

        ws.onerror = () => {
          const errorMessage = `WebSocket connection failed: ${endpoint}`
          logger.error(`Failed to connect to MCP server: ${serverId}`, new Error(errorMessage))
          this.updateHealthStatus(serverId, 'unhealthy', undefined, errorMessage)
          resolve(false)
        }

        ws.onclose = () => {
          this.handleDisconnection(serverId)
        }
      })
    } catch (error) {
      const errorMessage = `Connection setup failed for ${serverId}: ${(error as Error).message}`
      logger.error(`Connection error for server ${serverId}`, new Error(errorMessage))
      this.updateHealthStatus(serverId, 'unhealthy', undefined, errorMessage)
      return false
    }
  }

  // Disconnect from an MCP server
  async disconnect(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId)
    if (connection?.websocket) {
      connection.websocket.close()
      this.connections.delete(serverId)
      this.updateHealthStatus(serverId, 'unknown')
      logger.info(`Disconnected from MCP server: ${serverId}`)
    }
  }

  // Execute a tool on an MCP server
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

    try {
      if (!serverConfig.httpUrl) {
        return {
          success: false,
          error: `Server ${serverId} HTTP URL is not configured`,
          toolName,
          serverId
        }
      }

      const executeWithTimeout = withTimeout(
        this.makeHttpRequest(serverConfig.httpUrl, {
          tool: toolName,
          parameters
        }),
        serverConfig.timeout || MCP_SETTINGS.DEFAULT_TIMEOUT,
        `Tool execution timed out: ${toolName}`
      )

      const response = await withRetry(() => executeWithTimeout, serverConfig.retries || 1)

      return {
        success: true,
        data: response,
        toolName,
        serverId,
        executionTime: Date.now()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Tool execution failed: ${toolName} on ${serverId}`, error as Error)

      return {
        success: false,
        error: errorMessage,
        toolName,
        serverId,
        executionTime: Date.now()
      }
    }
  }

  // Send a message via WebSocket
  async sendMessage(serverId: string, message: unknown): Promise<boolean> {
    const connection = this.connections.get(serverId)

    if (!connection?.websocket || connection.websocket.readyState !== WebSocket.OPEN) {
      logger.error(`No active connection for server: ${serverId}`)
      return false
    }

    try {
      connection.websocket.send(JSON.stringify(message))
      return true
    } catch (error) {
      logger.error(`Failed to send message to server: ${serverId}`, error as Error)
      return false
    }
  }

  // Check server health
  async checkHealth(serverId: string): Promise<MCPHealthStatus> {
    const serverConfig = this.getServerConfig(serverId)

    if (!serverConfig) {
      return createHealthStatus(serverId, 'unknown', undefined, 'Unknown server')
    }

    const startTime = Date.now()

    try {
      await withTimeout(
        fetch(`${serverConfig.httpUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        5000,
        'Health check timed out'
      )

      const responseTime = Date.now() - startTime
      this.updateHealthStatus(serverId, 'healthy', responseTime)
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Health check failed'
      this.updateHealthStatus(serverId, 'unhealthy', responseTime, errorMessage)
    }

    return this.healthStatuses.get(serverId) || createHealthStatus(serverId, 'unknown')
  }

  // Get all connections
  getConnections(): MCPConnection[] {
    return Array.from(this.connections.values())
  }

  // Get connection by server ID
  getConnection(serverId: string): MCPConnection | undefined {
    return this.connections.get(serverId)
  }

  // Get health status by server ID
  getHealthStatus(serverId: string): MCPHealthStatus | undefined {
    return this.healthStatuses.get(serverId)
  }

  // Get all health statuses
  getAllHealthStatuses(): MCPHealthStatus[] {
    return Array.from(this.healthStatuses.values())
  }

  private async makeHttpRequest(url: string, data: unknown): Promise<unknown> {
    const response = await fetch(`${url}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new MCPError(
        `HTTP ${response.status}: ${response.statusText}`,
        'HTTP_ERROR'
      )
    }

    return response.json()
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

  private handleDisconnection(serverId: string): void {
    const connection = this.connections.get(serverId)
    if (!connection) return

    this.connections.delete(serverId)
    this.updateHealthStatus(serverId, 'unhealthy', undefined, 'Connection lost')

    // Auto-reconnect if enabled
    if (MCP_SETTINGS.ENABLE_AUTO_RECONNECT &&
        connection.reconnectAttempts < connection.maxReconnectAttempts) {
      setTimeout(() => {
        this.attemptReconnect(serverId)
      }, connection.reconnectInterval)
    }
  }

  private async attemptReconnect(serverId: string): Promise<void> {
    // PRODUCTION: No auto-reconnection - let errors surface properly
    logger.warn(`Connection lost for ${serverId} - no auto-reconnection in production mode`)
    this.updateHealthStatus(serverId, 'unhealthy', undefined, 'Connection lost - manual reconnection required')
  }

  private updateHealthStatus(
    serverId: string,
    status: MCPHealthStatus['status'],
    responseTime?: number,
    error?: string
  ): void {
    const healthStatus = createHealthStatus(serverId, status, responseTime, error)
    this.healthStatuses.set(serverId, healthStatus)
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [serverId] of this.connections) {
        await this.checkHealth(serverId)
      }
    }, MCP_SETTINGS.HEALTH_CHECK_INTERVAL)
  }

  // Cleanup method
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    for (const [serverId] of this.connections) {
      this.disconnect(serverId)
    }
  }
}

// Global MCP client instance
export const mcpClient = new MCPClient()
