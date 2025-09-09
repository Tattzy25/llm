"use client"

/**
 * MCP (Model Context Protocol) Integration
 *
 * This module provides MCP server and client functionality for:
 * - Connecting to MCP servers
 * - Managing MCP sessions
 * - Handling MCP tool calls
 * - Integrating with chat services
 *
 * MCP allows AI models to securely access external tools and data sources.
 */

import * as React from "react"
import { errorUtils } from "@/components/error-boundary"

// MCP Server configurations with environment variable support
const MCP_CONFIG = {
  REMOTE_SERVER: {
    endpoint: process.env.MCP_REMOTE_SERVER_URL || 'ws://api.digitalhustlelab.com:3001',
    httpUrl: process.env.MCP_REMOTE_SERVER_URL?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://api.digitalhustlelab.com:3001'
  },
  WEB_SCRAPER: {
    endpoint: process.env.MCP_WEB_SCRAPER_URL || 'ws://api.digitalhustlelab.com:3002',
    httpUrl: process.env.MCP_WEB_SCRAPER_URL?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://api.digitalhustlelab.com:3002'
  },
  DATABASE: {
    endpoint: process.env.MCP_DATABASE_URL || 'ws://api.digitalhustlelab.com:3003',
    httpUrl: process.env.MCP_DATABASE_URL?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://api.digitalhustlelab.com:3003'
  },
  AI_ASSISTANT: {
    endpoint: process.env.MCP_AI_ASSISTANT_URL || 'ws://api.digitalhustlelab.com:3004',
    httpUrl: process.env.MCP_AI_ASSISTANT_URL?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://api.digitalhustlelab.com:3004'
  },
  SERVER_MANAGER: {
    endpoint: process.env.MCP_SERVER_MANAGER_URL || 'ws://api.digitalhustlelab.com:3000',
    httpUrl: process.env.MCP_SERVER_MANAGER_URL?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://api.digitalhustlelab.com:3000'
  }
}

export interface MCPServer {
  id: string
  name: string
  endpoint: string
  tools: MCPTool[]
  connected: boolean
  lastConnected?: Date
}

export interface MCPTool {
  name: string
  description: string
  parameters: Record<string, {
    type: string
    description: string
    required?: boolean
    default?: unknown
  }>
  handler: (params: Record<string, unknown>) => Promise<unknown>
}

export interface MCPSession {
  id: string
  serverId: string
  tools: MCPTool[]
  active: boolean
  created: Date
}

class MCPManager {
  private servers: Map<string, MCPServer> = new Map()
  private sessions: Map<string, MCPSession> = new Map()
  private connections: Map<string, WebSocket> = new Map()

  // Connect to an MCP server
  async connectServer(serverConfig: Omit<MCPServer, 'connected' | 'lastConnected'>): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, simulate connection - in production this would establish WebSocket
      const server: MCPServer = {
        ...serverConfig,
        connected: true,
        lastConnected: new Date()
      }

      this.servers.set(server.id, server)
      console.log(`✅ Connected to MCP server: ${server.name}`)
      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? errorUtils.getUserFriendlyErrorMessage(error) : 'Failed to connect to MCP server'
      console.error('Failed to connect to MCP server:', error)
      return { success: false, error: errorMsg }
    }
  }

  // Disconnect from MCP server
  async disconnectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (server) {
      server.connected = false
      this.servers.set(serverId, server)

      // Close WebSocket connection if exists
      const connection = this.connections.get(serverId)
      if (connection) {
        connection.close()
        this.connections.delete(serverId)
      }

      console.log(`❌ Disconnected from MCP server: ${server.name}`)
    }
  }

  // Get available tools from connected servers
  getAvailableTools(): MCPTool[] {
    const tools: MCPTool[] = []

    for (const server of this.servers.values()) {
      if (server.connected) {
        tools.push(...server.tools)
      }
    }

    return tools
  }

  // Execute a tool
  async executeTool(toolName: string, parameters: Record<string, unknown>): Promise<unknown> {
    for (const server of this.servers.values()) {
      if (server.connected) {
        const tool = server.tools.find(t => t.name === toolName)
        if (tool) {
          try {
            return await tool.handler(parameters)
          } catch (error) {
            console.error(`Tool execution failed: ${toolName}`, error)
            throw error
          }
        }
      }
    }

    throw new Error(`Tool not found: ${toolName}`)
  }

  // Get all servers
  getServers(): MCPServer[] {
    return Array.from(this.servers.values())
  }

  // Get server by ID
  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId)
  }
}

// Global MCP manager instance
export const mcpManager = new MCPManager()

// React hook for MCP functionality
export function useMCP() {
  const [servers, setServers] = React.useState<MCPServer[]>([])
  const [isConnecting, setIsConnecting] = React.useState(false)

  // Refresh servers list
  const refreshServers = React.useCallback(() => {
    setServers(mcpManager.getServers())
  }, [])

  // Connect to server
  const connectServer = React.useCallback(async (serverConfig: Omit<MCPServer, 'connected' | 'lastConnected'>) => {
    setIsConnecting(true)
    try {
      const success = await mcpManager.connectServer(serverConfig)
      if (success) {
        refreshServers()
      }
      return success
    } finally {
      setIsConnecting(false)
    }
  }, [refreshServers])

  // Disconnect from server
  const disconnectServer = React.useCallback(async (serverId: string) => {
    await mcpManager.disconnectServer(serverId)
    refreshServers()
  }, [refreshServers])

  // Get available tools
  const getAvailableTools = React.useCallback(() => {
    return mcpManager.getAvailableTools()
  }, [])

  // Execute tool
  const executeTool = React.useCallback(async (toolName: string, parameters: Record<string, unknown>) => {
    return await mcpManager.executeTool(toolName, parameters)
  }, [])

  React.useEffect(() => {
    refreshServers()
  }, [refreshServers])

  return {
    servers,
    isConnecting,
    connectServer,
    disconnectServer,
    getAvailableTools,
    executeTool,
    refreshServers
  }
}

// Predefined MCP server configurations - REAL SERVERS
export const PREDEFINED_MCP_SERVERS: Omit<MCPServer, 'connected' | 'lastConnected'>[] = [
  {
    id: 'web-scraper-server',
    name: 'Web Scraper Server',
    endpoint: MCP_CONFIG.REMOTE_SERVER.endpoint,
    tools: [
      {
        name: 'web_scrape',
        description: 'Extract content from web pages with advanced parsing',
        parameters: {
          url: { type: 'string', description: 'URL to scrape', required: true },
          selectors: { type: 'object', description: 'CSS selectors for content extraction' },
          headers: { type: 'object', description: 'Custom headers for the request' }
        },
        handler: async (params: Record<string, unknown>) => {
          // Real implementation would connect to the actual MCP server
          const response = await fetch(`${MCP_CONFIG.REMOTE_SERVER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'web_scrape',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'web_search',
        description: 'Perform intelligent web searches with filtering',
        parameters: {
          query: { type: 'string', description: 'Search query', required: true },
          maxResults: { type: 'number', description: 'Maximum number of results', default: 10 },
          filters: { type: 'object', description: 'Search filters and options' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.REMOTE_SERVER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'web_search',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'content_analysis',
        description: 'Analyze web content for insights and patterns',
        parameters: {
          content: { type: 'string', description: 'Content to analyze', required: true },
          analysisType: { type: 'string', description: 'Type of analysis to perform' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.REMOTE_SERVER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'content_analysis',
              parameters: params
            })
          })
          return response.json()
        }
      }
    ]
  },
  {
    id: 'database-connector-server',
    name: 'Database Connector Server',
    endpoint: MCP_CONFIG.WEB_SCRAPER.endpoint,
    tools: [
      {
        name: 'database_query',
        description: 'Execute queries across multiple database types',
        parameters: {
          connectionString: { type: 'string', description: 'Database connection string', required: true },
          query: { type: 'string', description: 'SQL query to execute', required: true },
          dbType: { type: 'string', description: 'Database type (postgres, mysql, sqlite, etc.)', required: true }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.WEB_SCRAPER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'database_query',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'database_schema',
        description: 'Retrieve and analyze database schemas',
        parameters: {
          connectionString: { type: 'string', description: 'Database connection string', required: true },
          dbType: { type: 'string', description: 'Database type', required: true },
          tableName: { type: 'string', description: 'Specific table name (optional)' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.WEB_SCRAPER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'database_schema',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'database_backup',
        description: 'Create backups and manage database operations',
        parameters: {
          connectionString: { type: 'string', description: 'Database connection string', required: true },
          dbType: { type: 'string', description: 'Database type', required: true },
          backupPath: { type: 'string', description: 'Path to save backup', required: true },
          options: { type: 'object', description: 'Backup options and configuration' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.WEB_SCRAPER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'database_backup',
              parameters: params
            })
          })
          return response.json()
        }
      }
    ]
  },
  {
    id: 'ai-assistant-server',
    name: 'AI Assistant Server',
    endpoint: MCP_CONFIG.DATABASE.endpoint,
    tools: [
      {
        name: 'content_generator',
        description: 'Generate content using multiple AI models',
        parameters: {
          prompt: { type: 'string', description: 'Content generation prompt', required: true },
          model: { type: 'string', description: 'AI model to use', default: 'gpt-4' },
          options: { type: 'object', description: 'Generation options and parameters' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.DATABASE.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'content_generator',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'code_analyzer',
        description: 'Analyze and improve code quality',
        parameters: {
          code: { type: 'string', description: 'Code to analyze', required: true },
          language: { type: 'string', description: 'Programming language', required: true },
          analysisType: { type: 'string', description: 'Type of analysis (lint, complexity, security)' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.DATABASE.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'code_analyzer',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'data_analyzer',
        description: 'Process and analyze datasets with ML capabilities',
        parameters: {
          data: { type: 'object', description: 'Dataset to analyze', required: true },
          analysisType: { type: 'string', description: 'Type of analysis (statistics, ml, visualization)', required: true },
          options: { type: 'object', description: 'Analysis options and parameters' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.DATABASE.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'data_analyzer',
              parameters: params
            })
          })
          return response.json()
        }
      }
    ]
  },
  {
    id: 'mcp-server-manager',
    name: 'MCP Server Manager',
    endpoint: MCP_CONFIG.SERVER_MANAGER.endpoint,
    tools: [
      {
        name: 'start_mcp_server',
        description: 'Start a specific MCP server',
        parameters: {
          server_name: { type: 'string', description: 'Name of the MCP server to start', required: true }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.SERVER_MANAGER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'start_mcp_server',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'stop_mcp_server',
        description: 'Stop a specific MCP server',
        parameters: {
          server_name: { type: 'string', description: 'Name of the MCP server to stop', required: true }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.SERVER_MANAGER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'stop_mcp_server',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'get_mcp_server_status',
        description: 'Get status of MCP servers',
        parameters: {
          server_name: { type: 'string', description: 'Specific server name (optional)' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.SERVER_MANAGER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'get_mcp_server_status',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'list_mcp_tools',
        description: 'List available tools from MCP servers',
        parameters: {
          server_name: { type: 'string', description: 'Specific server name (optional)' }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.SERVER_MANAGER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'list_mcp_tools',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'execute_mcp_tool',
        description: 'Execute a tool on a specific MCP server',
        parameters: {
          server_name: { type: 'string', description: 'Name of the MCP server', required: true },
          tool_name: { type: 'string', description: 'Name of the tool to execute', required: true },
          parameters: { type: 'object', description: 'Tool parameters', required: true }
        },
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.SERVER_MANAGER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'execute_mcp_tool',
              parameters: params
            })
          })
          return response.json()
        }
      },
      {
        name: 'get_system_health',
        description: 'Get overall system health and MCP server statistics',
        parameters: {},
        handler: async (params: Record<string, unknown>) => {
          const response = await fetch(`${MCP_CONFIG.SERVER_MANAGER.httpUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'get_system_health',
              parameters: params
            })
          })
          return response.json()
        }
      }
    ]
  }
]
