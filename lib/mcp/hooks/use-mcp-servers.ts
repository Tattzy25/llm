"use client"
import { useMemo } from 'react'
import useMCP from './use-mcp'

export default function useMCPServers() {
	const client = useMCP()
	return useMemo(() => ({
		connections: client.getConnections(),
		isConnected: (id: string) => client.isConnected(id),
	}), [client])
}

