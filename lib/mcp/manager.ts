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
      // Mock data for now - replace with actual Redis queries
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
      }> = [
        {
          serverId: 'DESKTOP',
          status: 'up' as const,
          latency: { typical: 45, slowest: 120 },
          successRate: { last15min: 0.98, last24h: 0.95 },
          toolCount: 15,
          version: '1.0.0',
          schemaHash: 'abc123',
          lastChange: new Date().toISOString(),
          lastCheck: new Date().toISOString(),
          recentActivity: [
            { timestamp: new Date().toISOString(), tool: 'file_search', success: true, duration: 50 },
            { timestamp: new Date(Date.now() - 300000).toISOString(), tool: 'clipboard_read', success: true, duration: 25 }
          ],
          permissions: { readFiles: true, writeFiles: false, network: true, system: false }
        },
        {
          serverId: 'FILESYSTEM',
          status: 'up' as const,
          latency: { typical: 30, slowest: 80 },
          successRate: { last15min: 0.99, last24h: 0.97 },
          toolCount: 8,
          version: '1.1.0',
          schemaHash: 'def456',
          lastChange: new Date(Date.now() - 86400000).toISOString(),
          lastCheck: new Date().toISOString(),
          recentActivity: [
            { timestamp: new Date().toISOString(), tool: 'list_dir', success: true, duration: 35 }
          ],
          permissions: { readFiles: true, writeFiles: true, network: false, system: false }
        }
      ]

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
          userId: 'user_123',
          os: 'Windows 11',
          lastHeartbeat: new Date().toISOString(),
          lastSuccessfulCall: new Date().toISOString(),
          lastError: null,
          connectedServers: ['DESKTOP', 'FILESYSTEM'],
          permissionsGranted: { readFiles: true, writeFiles: false, network: true, system: false },
          totalCalls: 150,
          successRate: 0.96
        }
      ]

      const healthData = {
        status: 'up' as const,
        responseTime: {
          typical: 150,
          slowest: 2500
        },
        lastSuccess: {
          timestamp: new Date().toISOString(),
          reason: 'Tool execution successful'
        },
        lastFailure: {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          reason: 'Timeout on web scraping'
        },
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
      // Mock data - replace with actual metrics
      const reliabilityData = {
        successRate: {
          last15min: 0.95,
          last24h: 0.92
        },
        timeouts: {
          count: 12,
          topCauses: [
            { cause: 'Network timeout', count: 8 },
            { cause: 'Server overload', count: 4 }
          ]
        },
        crashes: {
          count: 2,
          topCauses: [
            { cause: 'Memory leak', count: 1 },
            { cause: 'Unhandled exception', count: 1 }
          ]
        },
        coldStarts: {
          averageTime: 1200,
          count: 45
        },
        retries: {
          total: 156,
          successAfterRetry: 142
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
      // Mock data - replace with actual usage tracking
      const usageData = {
        callsPerTool: {
          'web_scrape': 1250,
          'database_query': 890,
          'content_generator': 567,
          'file_search': 2340
        },
        activeUsers: {
          today: 45,
          last7days: 128
        },
        heavySessions: [
          { sessionId: 'sess_001', userId: 'user_123', calls: 150, duration: 3600 },
          { sessionId: 'sess_002', userId: 'user_456', calls: 120, duration: 2400 }
        ],
        popularTools: {
          'file_search': 2340,
          'web_scrape': 1250,
          'database_query': 890,
          'content_generator': 567
        }
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
      // Mock data - replace with actual cost tracking
      const costRiskData = {
        tokenEstimates: {
          'content_generator': 1500,
          'code_analyzer': 800
        },
        costEstimates: {
          'content_generator': 0.15,
          'code_analyzer': 0.08
        },
        dataSensitivity: {
          piiDetected: false,
          filePaths: true,
          secrets: false
        },
        permissions: {
          readFiles: true,
          writeFiles: false,
          systemControl: false,
          network: true
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
      // Mock data - replace with actual routing analytics
      const routingData = {
        handoffsPerSession: 2.3,
        loopsDetected: 5,
        averageStepsToFinish: 8.5,
        sessionStats: [
          { sessionId: 'sess_001', steps: 12, handoffs: 3, loops: 0 },
          { sessionId: 'sess_002', steps: 8, handoffs: 2, loops: 1 }
        ]
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
      // Mock data - replace with actual alert system
      const alertsData = [
        {
          id: 'alert_001',
          type: 'error_spike' as const,
          severity: 'medium' as const,
          message: 'Error rate increased by 25% in last 15 minutes',
          timestamp: new Date().toISOString(),
          serverId: 'WEB_SCRAPER'
        },
        {
          id: 'alert_002',
          type: 'slowdown' as const,
          severity: 'low' as const,
          message: 'Response time increased 2x for web_scrape tool',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          toolId: 'web_scrape'
        }
      ]
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
      // Mock test implementation - replace with actual server testing
      const testResult = {
        serverId,
        success: Math.random() > 0.1, // 90% success rate for demo
        latency: Math.floor(Math.random() * 200) + 50,
        toolsTested: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date().toISOString(),
        details: `Test completed for ${serverId}`
      }
      return createResult(true, testResult)
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
