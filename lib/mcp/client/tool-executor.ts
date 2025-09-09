import type { MCPExecutionResult } from '../types'
import { normalizeToMCPError } from '../utils/error-handling'

export class ToolExecutor {
	async executeTool(
		serverId: string,
		toolName: string,
		parameters: Record<string, unknown>,
		httpUrl: string,
		timeout = 30000,
		_retries = 0
	): Promise<MCPExecutionResult> {
		const controller = new AbortController()
		const id = setTimeout(() => controller.abort(), timeout)
		try {
			// Route through app API for uniform auth/error handling
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

