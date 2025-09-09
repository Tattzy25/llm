"use client"
import { useMemo } from 'react'
import { ALL_MCP_TOOLS } from '../tools'

export default function useMCPTools(serverId?: string) {
	return useMemo(() => (serverId ? ALL_MCP_TOOLS.filter(t => t.serverId === serverId) : ALL_MCP_TOOLS), [serverId])
}

