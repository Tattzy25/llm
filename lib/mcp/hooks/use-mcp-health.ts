"use client"
import { useMemo } from 'react'
import useMCP from './use-mcp'

export default function useMCPHealth() {
	const client = useMCP()
	return useMemo(() => ({
		list: client.getAllHealthStatuses(),
		summary: client.getHealthSummary(),
	}), [client])
}

