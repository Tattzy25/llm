import { NextResponse } from 'next/server'
import { ALL_MCP_TOOLS } from '@/lib/mcp/tools'
import { errorPayload, errorToStatus } from '@/lib/mcp/http'

export async function GET() {
	try {
		const tools = ALL_MCP_TOOLS.map(t => ({
			name: t.name,
			description: t.description,
			category: t.category,
			serverId: t.serverId,
			parameters: t.parameters,
		}))
		return NextResponse.json({ tools })
	} catch (err) {
		return NextResponse.json(errorPayload(err), { status: errorToStatus(err) })
	}
}

