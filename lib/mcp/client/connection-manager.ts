import type { MCPConnection } from '../types/server'
import { WebSocketHandler } from './websocket-handler'

export class ConnectionManager {
	private connections = new Map<string, MCPConnection>()

		async connect(serverId: string, endpoint: string): Promise<boolean> {
			// If it's ws(s)://, try real WebSocket
			if (/^wss?:\/\//i.test(endpoint)) {
				const ws = new WebSocketHandler()
				await ws.connect(endpoint)
				this.connections.set(serverId, { serverId, endpoint, status: 'connected', lastMessageAt: new Date() })
				return true
			}
			// Otherwise mark as connected placeholder (e.g., builtin)
			this.connections.set(serverId, { serverId, endpoint, status: 'connected', lastMessageAt: new Date() })
			return true
		}

	async disconnect(serverId: string): Promise<void> {
		this.connections.set(serverId, { serverId, status: 'disconnected' })
	}

	isConnected(serverId: string): boolean {
		return this.connections.get(serverId)?.status === 'connected'
	}

	sendMessage(serverId: string, _message: unknown): Promise<boolean> {
		// Placeholder; real impl will use websocket-handler
		const c = this.connections.get(serverId)
		if (!c || c.status !== 'connected') return Promise.resolve(false)
		this.connections.set(serverId, { ...c, lastMessageAt: new Date() })
		return Promise.resolve(true)
	}

	getAllConnections(): MCPConnection[] { return Array.from(this.connections.values()) }
	getConnection(serverId: string): MCPConnection | undefined { return this.connections.get(serverId) }
	cleanup(): void { this.connections.clear() }
}

