import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
	return NextResponse.json({
		error: true,
		code: 'AUTH_OAUTH_NOT_IMPLEMENTED',
		message: 'Google OAuth not implemented yet.'
	}, { status: 501 })
}
