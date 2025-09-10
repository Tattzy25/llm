import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
	// Basic redirect for Google OAuth - would normally integrate with OAuth provider
	const redirectUrl = new URL('/api/auth/callback', process.env.NEXTAUTH_URL || 'http://localhost:3000')
	
	return NextResponse.json({
		success: true,
		message: 'OAuth flow initiated',
		redirectUrl: redirectUrl.toString()
	}, { status: 200 })
}
