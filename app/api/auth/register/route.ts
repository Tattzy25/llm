import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
	try {
		// BYPASS AUTH - Open development mode
		// Return mock successful registration for development
		const body = await req.json()
		return NextResponse.json({
			success: true,
			user: {
				id: 'dev-user-' + Date.now(),
				username: body.username || 'Developer',
				email: body.email || 'dev@localhost',
				role: 'user',
				verified: true,
				subscription: 'free'
			},
			message: 'Registration successful (development mode)'
		}, { status: 201 })
	} catch (err) {
		return NextResponse.json({
			error: true,
			code: 'AUTH_ERROR',
			message: err instanceof Error ? err.message : 'Unexpected error'
		}, { status: 500 })
	}
}
