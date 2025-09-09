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

// Predefined MCP server configurations
export const PREDEFINED_MCP_SERVERS: Omit<MCPServer, 'connected' | 'lastConnected'>[] = [
  {
    id: 'filesystem',
    name: 'File System',
    endpoint: 'ws://digitalhustlelab.com:3001',
    tools: [
      {
        name: 'read_file',
        description: 'Read contents of a file',
        parameters: {
          path: { type: 'string', description: 'File path' }
        },
        handler: async (params: Record<string, unknown>) => {
          // Simulate file reading
          const path = params.path as string
          return { content: `Contents of ${path}` }
        }
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        parameters: {
          path: { type: 'string', description: 'Directory path' }
        },
        handler: async (params: Record<string, unknown>) => {
          // Simulate directory listing
          const path = params.path as string
          return { files: ['file1.txt', 'file2.js', 'subdir/'], directory: path }
        }
      }
    ]
  },
  {
    id: 'web_search',
    name: 'Web Search',
    endpoint: 'ws://digitalhustlelab.com:3002',
    tools: [
      {
        name: 'search_web',
        description: 'Search the web for information',
        parameters: {
          query: { type: 'string', description: 'Search query' }
        },
        handler: async (params: Record<string, unknown>) => {
          // Simulate web search
          const query = params.query as string
          return {
            results: [
              { title: `Results for "${query}"`, url: 'https://example.com/1', snippet: 'Snippet 1' },
              { title: 'Result 2', url: 'https://example.com/2', snippet: 'Snippet 2' }
            ]
          }
        }
      }
    ]
  },
  {
    id: 'database',
    name: 'Database',
    endpoint: 'ws://digitalhustlelab.com:3003',
    tools: [
      {
        name: 'query_database',
        description: 'Execute a database query',
        parameters: {
          query: { type: 'string', description: 'SQL query' }
        },
        handler: async (params: Record<string, unknown>) => {
          // Simulate database query
          const query = params.query as string
          return { rows: [{ id: 1, name: 'Example', query: query }] }
        }
      }
    ]
  }
]
