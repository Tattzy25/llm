"use client"

import type { MCPTool } from "../types"
import { withMCPErrorHandling, MCPServerUnavailableError } from "../utils/error-handling"

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
