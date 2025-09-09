import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
	try {
		// Placeholder implementation per project rules: no mock behavior.
		// Return 501 to indicate not implemented yet, with deterministic payload.
		return NextResponse.json({
			error: true,
			code: 'AUTH_NOT_IMPLEMENTED',
			message: 'Login endpoint not implemented yet.',
		}, { status: 501 })
	} catch (err) {
		return NextResponse.json({
			error: true,
			code: 'AUTH_ERROR',
			message: err instanceof Error ? err.message : 'Unexpected error'
		}, { status: 500 })
	}
}
