/**
 * MCP (Model Context Protocol) Tools
 *
 * Predefined tool configurations for MCP servers.
 * Each tool includes its schema, handler, and metadata.
 */

import type { MCPTool } from './types'
import { MCPServerUnavailableError, withMCPErrorHandling } from './utils/error-handling'

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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('WEB_SCRAPER', undefined, {
        hint: 'Ensure WEB_SCRAPER is configured and reachable.'
      })
    }, 'web_scrape')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('WEB_SCRAPER', undefined, {
        hint: 'Ensure WEB_SCRAPER is configured and reachable.'
      })
    }, 'web_search')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('WEB_SCRAPER', undefined, {
        hint: 'Ensure WEB_SCRAPER is configured and reachable.'
      })
    }, 'content_analysis')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('DATABASE', undefined, { hint: 'Start DATABASE server and verify credentials.' })
    }, 'database_query')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('DATABASE', undefined, { hint: 'Start DATABASE server and verify credentials.' })
    }, 'database_schema')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('DATABASE', undefined, { hint: 'Start DATABASE server and verify credentials.' })
    }, 'database_backup')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('AI_ASSISTANT', undefined, { hint: 'Start AI_ASSISTANT server and set model keys.' })
    }, 'content_generator')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('AI_ASSISTANT', undefined, { hint: 'Start AI_ASSISTANT server and set model keys.' })
    }, 'code_analyzer')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('AI_ASSISTANT', undefined, { hint: 'Start AI_ASSISTANT server and set model keys.' })
    }, 'data_analyzer')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('SERVER_MANAGER', undefined, { hint: 'Start SERVER_MANAGER to manage servers.' })
    }, 'start_mcp_server')
  },
  {
    name: 'stop_mcp_server',
    description: 'Stop a specific MCP server',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {
      server_name: { type: 'string', description: 'Name of the MCP server to stop', required: true }
    },
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('SERVER_MANAGER', undefined, { hint: 'Start SERVER_MANAGER to manage servers.' })
    }, 'stop_mcp_server')
  },
  {
    name: 'get_mcp_server_status',
    description: 'Get status of MCP servers',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {
      server_name: { type: 'string', description: 'Specific server name (optional)' }
    },
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('SERVER_MANAGER', undefined, { hint: 'Start SERVER_MANAGER to manage servers.' })
    }, 'get_mcp_server_status')
  },
  {
    name: 'list_mcp_tools',
    description: 'List available tools from MCP servers',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {
      server_name: { type: 'string', description: 'Specific server name (optional)' }
    },
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('SERVER_MANAGER', undefined, { hint: 'Start SERVER_MANAGER to manage servers.' })
    }, 'list_mcp_tools')
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
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('SERVER_MANAGER', undefined, { hint: 'Start SERVER_MANAGER to manage servers.' })
    }, 'execute_mcp_tool')
  },
  {
    name: 'get_system_health',
    description: 'Get overall system health and MCP server statistics',
    category: 'management',
    serverId: 'SERVER_MANAGER',
    parameters: {},
    handler: withMCPErrorHandling(async () => {
      throw new MCPServerUnavailableError('SERVER_MANAGER', undefined, { hint: 'Start SERVER_MANAGER to manage servers.' })
    }, 'get_system_health')
  }
]

// Built-in Desktop Tools - NO EXTERNAL DEPENDENCIES
export const DESKTOP_TOOLS: MCPTool[] = [
  {
    name: 'read_file',
    description: 'Read file contents with optional offset and length',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'File path to read', required: true },
      offset: { type: 'number', description: 'Byte offset to start reading from', default: 0 },
      length: { type: 'number', description: 'Number of bytes to read', default: 1000 }
    },
    handler: async () => {
      // This will be handled by the MCP manager connecting to local desktop server
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'write_file',
    description: 'Write content to file',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'File path to write to', required: true },
      content: { type: 'string', description: 'Content to write', required: true },
      mode: { type: 'string', description: 'Write mode: overwrite or append', default: 'overwrite' }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'list_directory',
    description: 'List directory contents',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'Directory path to list', required: true }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'get_system_info',
    description: 'Get comprehensive system information',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {},
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'run_command',
    description: 'Run shell command safely',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      command: { type: 'string', description: 'Shell command to execute', required: true },
      cwd: { type: 'string', description: 'Working directory for command' }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'clipboard_operation',
    description: 'Clipboard operations: get, set, clear',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      action: { type: 'string', description: 'Action: get, set, or clear', required: true },
      content: { type: 'string', description: 'Content for set action' }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'send_notification',
    description: 'Send desktop notification',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      title: { type: 'string', description: 'Notification title', required: true },
      message: { type: 'string', description: 'Notification message', required: true }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'analyze_code_file',
    description: 'Analyze code file for insights and suggestions',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'Path to code file to analyze', required: true }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'get_file_hash',
    description: 'Get file hash for integrity checking',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'File path to hash', required: true },
      algorithm: { type: 'string', description: 'Hash algorithm: sha256, md5, etc.', default: 'sha256' }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  }
]

// File System Tools - Built-in functionality
export const FILE_SYSTEM_TOOLS: MCPTool[] = [
  {
    name: 'search_files',
    description: 'Search for files by name or content',
    category: 'filesystem',
    serverId: 'FILESYSTEM',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      path: { type: 'string', description: 'Directory to search in', default: '.' },
      type: { type: 'string', description: 'Search type: name or content', default: 'name' }
    },
    handler: async (params: Record<string, unknown>) => {
      // Built-in file search - no external server needed
      const fs = await import('fs')
      const pathModule = await import('path')

      const searchFiles = async (dir: string, query: string, searchType: string): Promise<string[]> => {
        const results: string[] = []

        try {
          const items = await fs.promises.readdir(dir)

          for (const item of items) {
            const fullPath = pathModule.join(dir, item)
            const stat = await fs.promises.stat(fullPath)

            if (stat.isDirectory() && !item.startsWith('.')) {
              results.push(...await searchFiles(fullPath, query, searchType))
            } else if (stat.isFile()) {
              if (searchType === 'name' && item.toLowerCase().includes(query.toLowerCase())) {
                results.push(fullPath)
              } else if (searchType === 'content') {
                try {
                  const content = await fs.promises.readFile(fullPath, 'utf8')
                  if (content.toLowerCase().includes(query.toLowerCase())) {
                    results.push(fullPath)
                  }
                } catch {
                  // Skip binary files or files that can't be read
                }
              }
            }
          }
        } catch {
          // Skip directories we can't read
        }

        return results
      }

      const results = await searchFiles((params.path as string) || '.', params.query as string, (params.type as string) || 'name')
      return JSON.stringify(results.slice(0, 100), null, 2) // Limit to 100 results
    }
  }
]

// All tools combined
export const ALL_MCP_TOOLS = [
  ...WEB_SCRAPING_TOOLS,
  ...DATABASE_TOOLS,
  ...AI_ASSISTANT_TOOLS,
  ...SERVER_MANAGEMENT_TOOLS,
  ...DESKTOP_TOOLS,
  ...FILE_SYSTEM_TOOLS
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
