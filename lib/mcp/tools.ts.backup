"use client"

/**
 * MCP (Model Context Protocol) Tools
 *
 * Predefined tool configurations for MCP servers.
 * Each tool includes its schema, handler, and metadata.
 */

import type { MCPTool } from './types'

// Web Scraping Tools - PRODUCTION READY
export const WEB_SCRAPING_TOOLS: MCPTool[] = [
  {
    name: 'web_scrape',
    description: 'Extract content from web pages with advanced parsing',
    category: 'web-scraping',
    serverId: 'WEB_SCRAPER',
    parameters: {
      url: { type: 'string', description: 'URL to scrape', required: true },
      selectors: { type: 'object', description: 'CSS selectors for content extraction' },
      headers: { type: 'object', description: 'Custom headers for the request' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('WEB_SCRAPER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'web_search',
    description: 'Perform intelligent web searches with filtering',
    category: 'web-scraping',
    serverId: 'WEB_SCRAPER',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      maxResults: { type: 'number', description: 'Maximum number of results', default: 10 },
      filters: { type: 'object', description: 'Search filters and options' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('WEB_SCRAPER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'content_analysis',
    description: 'Analyze web content for insights and patterns',
    category: 'web-scraping',
    serverId: 'WEB_SCRAPER',
    parameters: {
      content: { type: 'string', description: 'Content to analyze', required: true },
      analysisType: { type: 'string', description: 'Type of analysis to perform' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('WEB_SCRAPER server is not configured or unavailable. Please check your environment variables and server status.')
    }
  }
]

// Database Tools - PRODUCTION READY
export const DATABASE_TOOLS: MCPTool[] = [
  {
    name: 'database_query',
    description: 'Execute queries across multiple database types',
    category: 'database',
    serverId: 'DATABASE',
    parameters: {
      connectionString: { type: 'string', description: 'Database connection string', required: true },
      query: { type: 'string', description: 'SQL query to execute', required: true },
      dbType: { type: 'string', description: 'Database type (postgres, mysql, sqlite, etc.)', required: true }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('DATABASE server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'database_schema',
    description: 'Retrieve and analyze database schemas',
    category: 'database',
    serverId: 'DATABASE',
    parameters: {
      connectionString: { type: 'string', description: 'Database connection string', required: true },
      dbType: { type: 'string', description: 'Database type', required: true },
      tableName: { type: 'string', description: 'Specific table name (optional)' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('DATABASE server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'database_backup',
    description: 'Create backups and manage database operations',
    category: 'database',
    serverId: 'DATABASE',
    parameters: {
      connectionString: { type: 'string', description: 'Database connection string', required: true },
      dbType: { type: 'string', description: 'Database type', required: true },
      backupPath: { type: 'string', description: 'Path to save backup', required: true },
      options: { type: 'object', description: 'Backup options and configuration' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('DATABASE server is not configured or unavailable. Please check your environment variables and server status.')
    }
  }
]

// AI Assistant Tools - PRODUCTION READY
export const AI_ASSISTANT_TOOLS: MCPTool[] = [
  {
    name: 'content_generator',
    description: 'Generate content using multiple AI models',
    category: 'ai',
    serverId: 'AI_ASSISTANT',
    parameters: {
      prompt: { type: 'string', description: 'Content generation prompt', required: true },
      model: { type: 'string', description: 'AI model to use', default: 'gpt-4' },
      options: { type: 'object', description: 'Generation options and parameters' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('AI_ASSISTANT server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'code_analyzer',
    description: 'Analyze and improve code quality',
    category: 'ai',
    serverId: 'AI_ASSISTANT',
    parameters: {
      code: { type: 'string', description: 'Code to analyze', required: true },
      language: { type: 'string', description: 'Programming language', required: true },
      analysisType: { type: 'string', description: 'Type of analysis (lint, complexity, security)' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('AI_ASSISTANT server is not configured or unavailable. Please check your environment variables and server status.')
    }
  },
  {
    name: 'data_analyzer',
    description: 'Process and analyze datasets with ML capabilities',
    category: 'ai',
    serverId: 'AI_ASSISTANT',
    parameters: {
      data: { type: 'object', description: 'Dataset to analyze', required: true },
      analysisType: { type: 'string', description: 'Type of analysis (statistics, ml, visualization)', required: true },
      options: { type: 'object', description: 'Analysis options and parameters' }
    },
    handler: async () => {
      // PRODUCTION: No mock implementation - throw proper error
      throw new Error('AI_ASSISTANT server is not configured or unavailable. Please check your environment variables and server status.')
    }
  }
]

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

// All tools combined
export const ALL_MCP_TOOLS = [
  ...WEB_SCRAPING_TOOLS,
  ...DATABASE_TOOLS,
  ...AI_ASSISTANT_TOOLS,
  ...SERVER_MANAGEMENT_TOOLS
]

// Tool categories
export const TOOL_CATEGORIES = {
  'web-scraping': WEB_SCRAPING_TOOLS,
  'database': DATABASE_TOOLS,
  'ai': AI_ASSISTANT_TOOLS,
  'management': SERVER_MANAGEMENT_TOOLS
}

// Get tools by category
export const getToolsByCategory = (category: string): MCPTool[] => {
  return TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES] || []
}

// Get tool by name
export const getToolByName = (name: string): MCPTool | undefined => {
  return ALL_MCP_TOOLS.find(tool => tool.name === name)
}

// Get tools by server
export const getToolsByServer = (serverId: string): MCPTool[] => {
  return ALL_MCP_TOOLS.filter(tool => tool.serverId === serverId)
}
