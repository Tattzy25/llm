"use client"

/**
 * MCP Connection Manager
 *
 * Handles WebSocket connections and disconnections for MCP servers.
 * PRODUCTION READY - NO FALLBACKS, NO AUTO-RECONNECT
 */

import type { MCPConnection } from '../types'
import { MCP_SETTINGS } from '../config'
import { createLogger } from '../utils'

const logger = createLogger('MCP-ConnectionManager')

export class ConnectionManager {
  private connections: Map<string, MCPConnection> = new Map()

  /**
   * Establish WebSocket connection to MCP server
   */
  async connect(serverId: string, endpoint: string): Promise<boolean> {
    try {
      // PRODUCTION: Strict validation - no fallbacks
      if (!endpoint) {
        const error = new Error(`MCP server endpoint for ${serverId} is not configured. Please set the appropriate environment variable.`)
        logger.error(`Missing endpoint configuration for server: ${serverId}`, error)
        return false
      }

      if (this.connections.has(serverId)) {
        await this.disconnect(serverId)
      }

      const connection: MCPConnection = {
        serverId,
        reconnectAttempts: 0,
        maxReconnectAttempts: 0, // PRODUCTION: NO RECONNECTS
        reconnectInterval: MCP_SETTINGS.RECONNECT_INTERVAL
      }

      const ws = new WebSocket(endpoint)

      return new Promise((resolve) => {
        ws.onopen = () => {
          connection.websocket = ws
          this.connections.set(serverId, connection)
          logger.info(`Connected to MCP server: ${serverId}`)
          resolve(true)
        }

        ws.onerror = () => {
          const errorMessage = `WebSocket connection failed: ${endpoint}`
          logger.error(`Failed to connect to MCP server: ${serverId}`, new Error(errorMessage))
          resolve(false)
        }

        ws.onclose = () => {
          this.handleDisconnection(serverId)
        }
      })
    } catch (error) {
      const errorMessage = `Connection setup failed for ${serverId}: ${(error as Error).message}`
      logger.error(`Connection error for server ${serverId}`, new Error(errorMessage))
      return false
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId)
    if (connection?.websocket) {
      connection.websocket.close()
      this.connections.delete(serverId)
      logger.info(`Disconnected from MCP server: ${serverId}`)
    }
  }

  /**
   * Send message via WebSocket
   */
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

  /**
   * Get connection by server ID
   */
  getConnection(serverId: string): MCPConnection | undefined {
    return this.connections.get(serverId)
  }

  /**
   * Get all connections
   */
  getAllConnections(): MCPConnection[] {
    return Array.from(this.connections.values())
  }

  /**
   * Check if server is connected
   */
  isConnected(serverId: string): boolean {
    const connection = this.connections.get(serverId)
    return connection?.websocket?.readyState === WebSocket.OPEN
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(serverId: string): void {
    const connection = this.connections.get(serverId)
    if (!connection) return

    this.connections.delete(serverId)
    logger.warn(`Connection lost for ${serverId} - no auto-reconnection in production mode`)
  }

  /**
   * Cleanup all connections
   */
  cleanup(): void {
    for (const [serverId] of this.connections) {
      this.disconnect(serverId)
    }
  }
}
