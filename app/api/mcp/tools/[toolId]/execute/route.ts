import { NextRequest, NextResponse } from 'next/server'
import { ALL_MCP_TOOLS } from '@/lib/mcp/tools'
import { errorPayload, errorToStatus } from '@/lib/mcp/http'
import { MCPValidationError } from '@/lib/mcp/utils/error-handling'

export async function POST(req: NextRequest, { params }: { params: { toolId: string } }) {
	try {
		const toolId = params.toolId
		const tool = ALL_MCP_TOOLS.find(t => t.name === toolId)
		if (!tool) throw new MCPValidationError(`Unknown tool: ${toolId}`, { code: 'TOOL_NOT_FOUND', context: toolId })

		const body = await req.json().catch(() => ({}))
		const args = (body?.parameters ?? body?.args ?? body) as Record<string, unknown>

		// Minimal required params validation
		for (const [k, meta] of Object.entries(tool.parameters)) {
			if (meta.required && (args[k] === undefined || args[k] === null || args[k] === '')) {
				throw new MCPValidationError(`Missing required parameter: ${k}`, { context: tool.name })
			}
		}

		const result = await tool.handler(args)
		return NextResponse.json({ success: true, result })
	} catch (err) {
		return NextResponse.json(errorPayload(err), { status: errorToStatus(err) })
	}
}

