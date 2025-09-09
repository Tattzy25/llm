import type { MCPExecutionResult } from '../types'
import { normalizeToMCPError } from '../utils/error-handling'
import { WebSocketHandler } from './websocket-handler'

export class ToolExecutor {
			async executeTool(
		serverId: string,
		toolName: string,
		parameters: Record<string, unknown>,
				httpUrl: string,
				wsEndpoint?: string,
		timeout = 30000,
		_retries = 0
	): Promise<MCPExecutionResult> {
		const controller = new AbortController()
		const id = setTimeout(() => controller.abort(), timeout)
		try {
							// Prefer WebSocket endpoint if provided (native JSON-RPC tools/call)
							if (wsEndpoint && /^wss?:\/\//i.test(wsEndpoint)) {
								const endpoint = wsEndpoint
						const ws = new WebSocketHandler()
						await ws.connect(endpoint)
						const result = await ws.request('tools/call', { name: toolName, arguments: parameters })
						ws.close()
						return { success: true, data: result, toolName, serverId }
					}

					// Otherwise route through Next API for uniform auth/error handling
					const res = await fetch(`/api/mcp/tools/${encodeURIComponent(toolName)}/execute`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ serverId, parameters, httpUrl }),
						signal: controller.signal,
					})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) {
				const err = normalizeToMCPError(new Error(json?.message || `HTTP ${res.status}`), { context: toolName })
				return { success: false, error: err.message, toolName, serverId }
			}
			return { success: true, data: json.result ?? json, toolName, serverId }
		} catch (e) {
			const err = normalizeToMCPError(e, { context: toolName })
			return { success: false, error: err.message, toolName, serverId }
		} finally {
			clearTimeout(id)
		}
	}
}

