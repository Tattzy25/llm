"use client"
import { useMemo } from 'react'
import { mcpClient } from '../client/index'

export default function useMCP() {
	return useMemo(() => mcpClient, [])
}

