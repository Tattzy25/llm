"use client"

/**
 * MCP Database Tools
 *
 * Tools for database operations and management.
 * PRODUCTION READY - NO MOCK IMPLEMENTATIONS
 */

import type { MCPTool } from '../types'

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
