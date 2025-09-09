"use client"

/**
 * MCP Server Management Tools
 *
 * Tools for managing MCP servers and system operations.
 * PRODUCTION READY - NO MOCK IMPLEMENTATIONS
 */

import type { MCPTool } from '../types'

// Server Management Tools - PRODUCTION READY
export const SERVER_MANAGEMENT_TOOLS: MCPTool[] = [
  {
    name: 'start_mcp_server',
    description: 'Start a specific MCP server',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {
      server_name: { type: 'string', description: 'Name of the MCP server to start', required: true }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('SERVER_MANAGER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'stop_mcp_server',
    description: 'Stop a specific MCP server',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {
      server_name: { type: 'string', description: 'Name of the MCP server to stop', required: true }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('SERVER_MANAGER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'get_mcp_server_status',
    description: 'Get status of MCP servers',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {
      server_name: { type: 'string', description: 'Specific server name (optional)' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('SERVER_MANAGER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'list_mcp_tools',
    description: 'List available tools from MCP servers',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {
      server_name: { type: 'string', description: 'Specific server name (optional)' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('SERVER_MANAGER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'execute_mcp_tool',
    description: 'Execute a tool on a specific MCP server',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {
      server_name: { type: 'string', description: 'Name of the MCP server', required: true },
      tool_name: { type: 'string', description: 'Name of the tool to execute', required: true },
      parameters: { type: 'object', description: 'Tool parameters', required: true }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('SERVER_MANAGER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'get_system_health',
    description: 'Get overall system health and MCP server statistics',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {},
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('SERVER_MANAGER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  }
]
