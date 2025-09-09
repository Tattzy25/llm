export type MCPConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export interface MCPConnection {
	serverId: string
	endpoint?: string
	status: MCPConnectionStatus
	lastMessageAt?: Date
}

export type MCPHealth = 'healthy' | 'unhealthy' | 'unknown'

export interface MCPHealthStatus {
	serverId: string
	status: MCPHealth
	lastChecked: Date
	responseTimeMs?: number
	error?: string
}
