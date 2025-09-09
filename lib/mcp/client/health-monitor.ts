"use client"

/**
 * MCP Health Monitor
 *
 * Monitors health status of MCP servers and connections.
 * PRODUCTION READY - ENHANCED ERROR HANDLING
 */

import type { MCPHealthStatus } from '../types'
import { createLogger, withTimeout, createHealthStatus } from '../utils'

const logger = createLogger('MCP-HealthMonitor')

export class HealthMonitor {
  private healthStatuses: Map<string, MCPHealthStatus> = new Map()
  private healthCheckInterval?: NodeJS.Timeout

  constructor() {
    // Health monitoring is optional in production
  }

  /**
   * Check health of a specific MCP server
   */
  async checkHealth(serverId: string, httpUrl: string): Promise<MCPHealthStatus> {
    const startTime = Date.now()

    try {
      await withTimeout(
        fetch(`${httpUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }),
        5000,
        'Health check timed out'
      )

      const responseTime = Date.now() - startTime
      this.updateHealthStatus(serverId, 'healthy', responseTime)
      logger.debug(`Health check passed for ${serverId} (${responseTime}ms)`)
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Health check failed'
      this.updateHealthStatus(serverId, 'unhealthy', responseTime, errorMessage)
      logger.warn(`Health check failed for ${serverId}: ${errorMessage}`)
    }

    return this.healthStatuses.get(serverId) || createHealthStatus(serverId, 'unknown')
  }

  /**
   * Get health status by server ID
   */
  getHealthStatus(serverId: string): MCPHealthStatus | undefined {
    return this.healthStatuses.get(serverId)
  }

  /**
   * Get all health statuses
   */
  getAllHealthStatuses(): MCPHealthStatus[] {
    return Array.from(this.healthStatuses.values())
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(
    serverIds: string[],
    httpUrls: Map<string, string>,
    interval: number = 30000
  ): void {
    this.stopHealthChecks() // Clear any existing interval

    this.healthCheckInterval = setInterval(async () => {
      for (const serverId of serverIds) {
        const httpUrl = httpUrls.get(serverId)
        if (httpUrl) {
          await this.checkHealth(serverId, httpUrl)
        }
      }
    }, interval)

    logger.info(`Started health checks for ${serverIds.length} servers (interval: ${interval}ms)`)
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
      logger.info('Stopped health checks')
    }
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
    const statuses = this.getAllHealthStatuses()
    const healthy = statuses.filter(s => s.status === 'healthy')
    const unhealthy = statuses.filter(s => s.status === 'unhealthy')
    const unknown = statuses.filter(s => s.status === 'unknown')

    const totalResponseTime = healthy.reduce((sum, s) => sum + (s.responseTime || 0), 0)
    const averageResponseTime = healthy.length > 0 ? totalResponseTime / healthy.length : 0

    return {
      total: statuses.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      unknown: unknown.length,
      averageResponseTime: Math.round(averageResponseTime)
    }
  }

  /**
   * Update health status
   */
  private updateHealthStatus(
    serverId: string,
    status: MCPHealthStatus['status'],
    responseTime?: number,
    error?: string
  ): void {
    const healthStatus = createHealthStatus(serverId, status, responseTime, error)
    this.healthStatuses.set(serverId, healthStatus)
  }

  /**
   * Clear health status for a server
   */
  clearHealthStatus(serverId: string): void {
    this.healthStatuses.delete(serverId)
  }

  /**
   * Cleanup all health statuses
   */
  cleanup(): void {
    this.stopHealthChecks()
    this.healthStatuses.clear()
  }
}
