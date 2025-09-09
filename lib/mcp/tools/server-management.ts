// isomorphic module: safe for server and client imports

import type { MCPTool } from "../types"
import { withMCPErrorHandling, MCPServerUnavailableError } from "../utils/error-handling"

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
