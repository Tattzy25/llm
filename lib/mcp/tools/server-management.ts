// isomorphic module: safe for server and client imports

import type { MCPTool } from "../types"
import { withMCPErrorHandling, MCPServerUnavailableError } from "../utils/error-handling"
import { getMCPConfig } from "../config"

// Tiny JSON-RPC over WebSocket helper (Node-only) used inside API route execution
// Tiny JSON-RPC over WebSocket helper (Node-only) used inside API route execution
async function wsRpc<T = unknown>(wsBase: string, serverName: string, method: string, params?: Record<string, unknown>): Promise<T> {
	// Type definitions for WebSocket functionality
	interface WSInstance {
		on: (event: 'open' | 'message' | 'error' | 'close', cb: (...args: unknown[]) => void) => void;
		send: (data: string) => void;
		close: () => void;
	}
	type WSConstructor = new (address: string, protocols?: string | string[], options?: Record<string, unknown>) => WSInstance;
	// Only construct in Node (Next.js API route). Avoid bundling in the browser.
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const WSMod = require('ws') as { WebSocket?: WSConstructor; default?: WSConstructor } & WSConstructor;
	const WSConstructor = (WSMod.WebSocket || WSMod.default || WSMod) as unknown as WSConstructor

	const url = `${wsBase.replace(/\/$/, '')}/ws/${encodeURIComponent(serverName)}`
	return await new Promise<T>((resolve, reject) => {
		const ws = new WSConstructor(url)
		const id = Math.floor(Math.random() * 1e9)
		const payload = { jsonrpc: '2.0', id, method, params }
		const timer = setTimeout(() => { try { ws.close() } catch { /* ignore close errors */ } ; reject(new Error('WS RPC timeout')) }, 20000)
		ws.on('open', () => { ws.send(JSON.stringify(payload)) })
		ws.on('message', (data: Buffer) => {
			try {
				const msg = JSON.parse((data as unknown as Buffer).toString())
				if (msg && msg.id === id) {
					clearTimeout(timer)
					;('error' in msg ? reject(new Error(msg.error?.message || 'WS RPC error')) : resolve(msg.result as T))
					try { ws.close() } catch { /* ignore close errors */ }
				}
			} catch (e) { 
				/* ignore non-JSON parse errors */ 
				console.warn('WS RPC parse error:', e)
			}
		})
		ws.on('error', (err: Error) => { clearTimeout(timer); reject(err) })
		ws.on('close', () => { /* noop */ })
	})
}

export const SERVER_MANAGEMENT_TOOLS: MCPTool[] = [
	{
		name: 'start_mcp_server',
		description: 'Start a specific MCP server',
		category: 'management',
		serverId: 'SERVER_MANAGER',
		parameters: {
			server_name: { type: 'string', description: 'Name of the MCP server to start', required: true }
		},
		handler: withMCPErrorHandling(async (args) => {
			const { SERVER_MANAGER } = getMCPConfig()
			if (!SERVER_MANAGER.httpUrl) throw new MCPServerUnavailableError('SERVER_MANAGER')
			const res = await fetch(`${SERVER_MANAGER.httpUrl.replace(/\/$/, '')}/servers/${encodeURIComponent(String(args.server_name))}/start`, { method: 'POST' })
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json?.detail || json?.message || `HTTP ${res.status}`)
			return json
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
		handler: withMCPErrorHandling(async (args) => {
			const { SERVER_MANAGER } = getMCPConfig()
			if (!SERVER_MANAGER.httpUrl) throw new MCPServerUnavailableError('SERVER_MANAGER')
			const res = await fetch(`${SERVER_MANAGER.httpUrl.replace(/\/$/, '')}/servers/${encodeURIComponent(String(args.server_name))}/stop`, { method: 'POST' })
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(json?.detail || json?.message || `HTTP ${res.status}`)
			return json
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
		handler: withMCPErrorHandling(async (args) => {
			const { SERVER_MANAGER } = getMCPConfig()
			if (!SERVER_MANAGER.httpUrl) throw new MCPServerUnavailableError('SERVER_MANAGER')
			const res = await fetch(`${SERVER_MANAGER.httpUrl.replace(/\/$/, '')}/servers`)
			const json = await res.json()
			if (args?.server_name) {
				const match = (json?.servers || []).find((s: { config?: { name?: string; module?: string } }) => s?.config?.name?.toLowerCase().includes(String(args.server_name).toLowerCase()) || s?.config?.module?.includes(String(args.server_name)))
				return match || { status: 'unknown', name: args.server_name }
			}
			return json
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
		handler: withMCPErrorHandling(async (args) => {
			const { SERVER_MANAGER } = getMCPConfig()
			if (!SERVER_MANAGER.endpoint) throw new MCPServerUnavailableError('SERVER_MANAGER')
			const serverName = String(args?.server_name || 'desktop')
			const result = await wsRpc<{ tools: Array<{ name: string; description: string; parameters?: Record<string, unknown> }> }>(SERVER_MANAGER.endpoint, serverName, 'tools/list')
			return result
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
		handler: withMCPErrorHandling(async (args) => {
			const { SERVER_MANAGER } = getMCPConfig()
			if (!SERVER_MANAGER.endpoint) throw new MCPServerUnavailableError('SERVER_MANAGER')
			const serverName = String(args.server_name)
			const payload = { name: String(args.tool_name), arguments: (args.parameters as Record<string, unknown>) || {} }
			const result = await wsRpc(SERVER_MANAGER.endpoint, serverName, 'tools/call', payload)
			return result
		}, 'execute_mcp_tool')
	},
	{
		name: 'get_system_health',
		description: 'Get overall system health and MCP server statistics',
		category: 'management',
		serverId: 'SERVER_MANAGER',
		parameters: {},
		handler: withMCPErrorHandling(async () => {
			const { SERVER_MANAGER } = getMCPConfig()
			if (!SERVER_MANAGER.httpUrl) throw new MCPServerUnavailableError('SERVER_MANAGER')
			const base = SERVER_MANAGER.httpUrl.replace(/\/$/, '')
			const [healthRes, serversRes] = await Promise.all([
				fetch(`${base}/health`),
				fetch(`${base}/servers`)
			])
			const health = await healthRes.json().catch(() => ({}))
			const servers = await serversRes.json().catch(() => ({}))
			return { ...health, servers }
		}, 'get_system_health')
	}
]
