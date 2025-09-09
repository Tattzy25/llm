"use client"

import { useState } from "react"
import type { MCPExecutionResult } from "@/lib/mcp/types"
import { getMCPManager } from "@/lib/mcp/manager"
import { showError } from "@/lib/error-bus"

export function useToolExecution() {
	const [executing, setExecuting] = useState(false)
	const [result, setResult] = useState<MCPExecutionResult | null>(null)

	const execute = async (toolName: string, params: Record<string, unknown>) => {
		setExecuting(true)
		try {
			const mgr = getMCPManager()
			const res = await mgr.executeTool(toolName, params)
			setResult(res)
			if (!res.success) showError(res.error || `Execution failed for ${toolName}`, `Tool: ${toolName}`)
		} catch (e) {
			const err = String(e)
			setResult({ success: false, error: err, executionTime: Date.now() } as MCPExecutionResult)
			showError(err, `Tool: ${toolName}`)
		} finally {
			setExecuting(false)
		}
	}

	return { executing, result, execute }
}

