import type { MCPExecutionResult } from '../types'
import { createResult } from '../utils'
import type { MCPClient } from '../client/index'

export class ServerLifecycleManager {
	private active = new Set<string>()
	constructor(private client: MCPClient) {}

	async startAllServers(): Promise<MCPExecutionResult[]> { return [] }
	async startServer(serverId: string): Promise<MCPExecutionResult> {
		this.active.add(serverId)
		return createResult(true, `Server ${serverId} started`)
	}
	async stopServer(serverId: string): Promise<MCPExecutionResult> {
		this.active.delete(serverId)
		return createResult(true, `Server ${serverId} stopped`)
	}
	async stopAllServers(): Promise<MCPExecutionResult[]> { this.active.clear(); return [] }
	isServerActive(serverId: string) { return this.active.has(serverId) }
	getActiveServers() { return Array.from(this.active) }
	async getServerStatus(serverId?: string): Promise<MCPExecutionResult> {
		if (serverId) return createResult(true, { serverId, active: this.active.has(serverId) })
		const data = Object.fromEntries(this.getActiveServers().map(id => [id, { active: true }]))
		return createResult(true, data)
	}
}

