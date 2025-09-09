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
import { ALL_MCP_TOOLS, getToolsByServer } from './tools/index'
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

      // Handle built-in tools that don't require external servers
      if (tool.serverId === 'FILESYSTEM') {
        try {
          const result = await tool.handler(parameters)
          return createResult(true, result)
        } catch (error) {
          return createResult(false, undefined, `Built-in tool execution failed: ${error}`)
        }
      }

      // Check if server is active for external servers
      if (!tool.serverId || !this.activeServers.has(tool.serverId)) {
        if (!tool.serverId) {
          return createResult(false, undefined, 'Tool has no server ID')
        }

        // Skip server start for built-in tools
        if (tool.serverId !== 'DESKTOP') {
          const startResult = await this.startServer(tool.serverId)
          if (!startResult.success) {
            return createResult(false, undefined, `Server ${tool.serverId} is not available`)
          }
        }
      }

      // Execute the tool via MCP client for external servers
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
   * Get detailed health metrics including per-server and per-user data
   */
  async getHealthMetrics(): Promise<MCPExecutionResult> {
    try {
      const serverMetrics: Array<{
        serverId: string
        status: 'up' | 'down' | 'degraded'
        latency: { typical: number; slowest: number }
        successRate: { last15min: number; last24h: number }
        toolCount: number
        version: string
        schemaHash: string
        lastChange: string
        lastCheck: string
        recentActivity: Array<{
          timestamp: string
          tool: string
          success: boolean
          duration: number
          userId?: string
        }>
        permissions: {
          readFiles: boolean
          writeFiles: boolean
          network: boolean
          system: boolean
        }
      }> = []

      // Check each configured server
      for (const serverId of Object.keys(this.config)) {
        const isActive = this.activeServers.has(serverId)
        const serverConfig = this.config[serverId as keyof typeof this.config]

        let latency = { typical: 0, slowest: 0 }
        let successRate = { last15min: 0.5, last24h: 0.5 } // Default fallback
        let toolCount = 0
        let status: 'up' | 'down' | 'degraded' = 'down'

        if (isActive && serverConfig && typeof serverConfig === 'object' && 'tools' in serverConfig) {
          status = 'up'
          toolCount = Array.isArray(serverConfig.tools) ? serverConfig.tools.length : 0

          // Try to get actual latency by running a quick test
          try {
            const startTime = Date.now()
            await this.client.executeTool(serverId, 'health_check', {})
            const responseTime = Date.now() - startTime
            latency = { typical: responseTime, slowest: responseTime }
            successRate = { last15min: 0.95, last24h: 0.90 } // Assume good performance if responding
          } catch {
            status = 'degraded'
            latency = { typical: 1000, slowest: 5000 }
            successRate = { last15min: 0.5, last24h: 0.5 }
          }
        }

        serverMetrics.push({
          serverId,
          status,
          latency,
          successRate,
          toolCount,
          version: '1.0.0',
          schemaHash: 'unknown',
          lastChange: new Date().toISOString(),
          lastCheck: new Date().toISOString(),
          recentActivity: [],
          permissions: {
            readFiles: serverId === 'FILESYSTEM' || serverId === 'DESKTOP',
            writeFiles: serverId === 'FILESYSTEM',
            network: serverId === 'WEB_SCRAPER',
            system: serverId === 'DESKTOP'
          }
        })
      }

      // For now, return minimal user metrics - in production this would come from Redis/session data
      const userMetrics: Array<{
        userId: string
        os: string
        lastHeartbeat: string
        lastSuccessfulCall: string
        lastError: {
          timestamp: string
          error: string
          serverId: string
        } | null
        connectedServers: string[]
        permissionsGranted: {
          readFiles: boolean
          writeFiles: boolean
          network: boolean
          system: boolean
        }
        totalCalls: number
        successRate: number
      }> = [
        {
          userId: 'current_user',
          os: 'Unknown', // Would be detected from user agent/session
          lastHeartbeat: new Date().toISOString(),
          lastSuccessfulCall: new Date().toISOString(),
          lastError: null,
          connectedServers: Array.from(this.activeServers),
          permissionsGranted: { readFiles: true, writeFiles: false, network: true, system: false },
          totalCalls: 0, // Would be tracked in production
          successRate: 1.0
        }
      ]

      const healthData = {
        status: serverMetrics.some(s => s.status === 'up') ? 'up' : 'down',
        responseTime: {
          typical: serverMetrics.reduce((sum, s) => sum + s.latency.typical, 0) / serverMetrics.length || 0,
          slowest: Math.max(...serverMetrics.map(s => s.latency.slowest)) || 0
        },
        lastSuccess: {
          timestamp: new Date().toISOString(),
          reason: 'Health check completed'
        },
        lastFailure: serverMetrics.some(s => s.status === 'down') ? {
          timestamp: new Date().toISOString(),
          reason: 'Some servers are down'
        } : null,
        version: '1.0.0',
        schemaChanged: false,
        lastSchemaCheck: new Date().toISOString(),
        serverMetrics,
        userMetrics
      }

      return createResult(true, healthData)
    } catch (error) {
      return createResult(false, undefined, `Failed to get health metrics: ${error}`)
    }
  }

  /**
   * Get reliability metrics
   */
  async getReliabilityMetrics(): Promise<MCPExecutionResult> {
    try {
      // Calculate reliability based on actual server states
      const activeServers = Array.from(this.activeServers)
      const totalConfiguredServers = Object.keys(this.config).length

      const successRate = {
        last15min: activeServers.length / totalConfiguredServers,
        last24h: activeServers.length / totalConfiguredServers
      }

      // For now, return basic reliability data - in production this would track actual errors/timeouts
      const reliabilityData = {
        successRate,
        timeouts: {
          count: 0, // Would be tracked in production
          topCauses: []
        },
        crashes: {
          count: 0, // Would be tracked in production
          topCauses: []
        },
        coldStarts: {
          averageTime: 500, // Would be measured in production
          count: totalConfiguredServers - activeServers.length
        },
        retries: {
          total: 0, // Would be tracked in production
          successAfterRetry: 0
        }
      }

      return createResult(true, reliabilityData)
    } catch (error) {
      return createResult(false, undefined, `Failed to get reliability metrics: ${error}`)
    }
  }

  /**
   * Get usage metrics
   */
  async getUsageMetrics(): Promise<MCPExecutionResult> {
    try {
      // Calculate usage based on available tools and servers
      const allTools = ALL_MCP_TOOLS
      const callsPerTool: Record<string, number> = {}

      // Initialize all tools with 0 usage
      allTools.forEach((tool: MCPTool) => {
        callsPerTool[tool.name] = 0
      })

      // For now, return basic usage data - in production this would track actual usage
      const usageData = {
        callsPerTool,
        activeUsers: {
          today: 1, // Current user
          last7days: 1
        },
        heavySessions: [], // Would be tracked in production
        popularTools: callsPerTool
      }

      return createResult(true, usageData)
    } catch (error) {
      return createResult(false, undefined, `Failed to get usage metrics: ${error}`)
    }
  }

  /**
   * Get cost and risk metrics
   */
  async getCostRiskMetrics(): Promise<MCPExecutionResult> {
    try {
      // For now, return basic cost/risk data - in production this would track actual usage costs
      const costRiskData = {
        tokenEstimates: {}, // Would be calculated based on actual tool usage
        costEstimates: {}, // Would be calculated based on actual API costs
        dataSensitivity: {
          piiDetected: false, // Would be detected in production
          filePaths: true, // File system tools access paths
          secrets: false // Would be detected in production
        },
        permissions: {
          readFiles: this.activeServers.has('FILESYSTEM') || this.activeServers.has('DESKTOP'),
          writeFiles: this.activeServers.has('FILESYSTEM'),
          systemControl: this.activeServers.has('DESKTOP'),
          network: this.activeServers.has('WEB_SCRAPER') || this.activeServers.has('DATABASE')
        }
      }

      return createResult(true, costRiskData)
    } catch (error) {
      return createResult(false, undefined, `Failed to get cost/risk metrics: ${error}`)
    }
  }

  /**
   * Get routing metrics
   */
  async getRoutingMetrics(): Promise<MCPExecutionResult> {
    try {
      // For now, return basic routing data - in production this would track actual routing patterns
      const routingData = {
        handoffsPerSession: 0, // Would be calculated from actual sessions
        loopsDetected: 0, // Would be detected in production
        averageStepsToFinish: 1, // Basic single-step execution
        sessionStats: [] // Would be populated from actual session data
      }

      return createResult(true, routingData)
    } catch (error) {
      return createResult(false, undefined, `Failed to get routing metrics: ${error}`)
    }
  }

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<MCPExecutionResult> {
    try {
      // Check for basic alerts based on server status
      const alertsData: Array<{
        id: string
        type: 'error_spike' | 'timeout_spike' | 'schema_change' | 'looping' | 'cost_anomaly' | 'slowdown'
        severity: 'low' | 'medium' | 'high' | 'critical'
        message: string
        timestamp: string
        serverId?: string
        toolId?: string
      }> = []

      // Check for basic alerts based on server status
      for (const serverId of Object.keys(this.config)) {
        const isActive = this.activeServers.has(serverId)
        if (!isActive) {
          alertsData.push({
            id: `server_down_${serverId}`,
            type: 'error_spike',
            severity: 'high',
            message: `Server ${serverId} is not running`,
            timestamp: new Date().toISOString(),
            serverId
          })
        }
      }

      return createResult(true, alertsData)
    } catch (error) {
      return createResult(false, undefined, `Failed to get alerts: ${error}`)
    }
  }

  /**
   * Run a test on a specific server
   */
  async runServerTest(serverId: string): Promise<MCPExecutionResult> {
    try {
      const startTime = Date.now()

      // Try to connect to the server and run a basic health check
      const serverConfig = this.getServerConfig(serverId)
      if (!serverConfig) {
        return createResult(false, undefined, `Server configuration not found: ${serverId}`)
      }

      // Attempt to start the server if not running
      const isRunning = this.activeServers.has(serverId)
      if (!isRunning) {
        const startResult = await this.startServer(serverId)
        if (!startResult.success) {
          return createResult(false, undefined, `Failed to start server for testing: ${startResult.error}`)
        }
      }

      // Run a health check by attempting to execute a simple tool
      try {
        const healthCheck = await this.client.executeTool(serverId, 'health_check', {})
        const latency = Date.now() - startTime

        const testResult = {
          serverId,
          success: healthCheck.success,
          latency,
          toolsTested: 1,
          timestamp: new Date().toISOString(),
          details: healthCheck.success ? `Health check passed for ${serverId}` : `Health check failed for ${serverId}`
        }

        return createResult(true, testResult)
      } catch (toolError) {
        const latency = Date.now() - startTime
        const testResult = {
          serverId,
          success: false,
          latency,
          toolsTested: 1,
          timestamp: new Date().toISOString(),
          details: `Tool execution failed: ${toolError}`
        }
        return createResult(true, testResult) // Return test result even if tool failed
      }
    } catch (error) {
      return createResult(false, undefined, `Failed to run test for ${serverId}: ${error}`)
    }
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
