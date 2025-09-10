import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const { email, password } = body

		// Basic validation
		if (!email || !password) {
			return NextResponse.json({
				error: true,
				code: 'VALIDATION_ERROR',
				message: 'Email and password are required.',
			}, { status: 400 })
		}

		// Basic success response for development
		// In production, this would validate against a database
		return NextResponse.json({
			success: true,
			message: 'Login successful',
			user: {
				id: 'demo-user',
				email: email,
				name: 'Demo User'
			}
		}, { status: 200 })
	} catch (err) {
		return NextResponse.json({
			error: true,
			code: 'AUTH_ERROR',
			message: err instanceof Error ? err.message : 'Unexpected error'
		}, { status: 500 })
	}
}
