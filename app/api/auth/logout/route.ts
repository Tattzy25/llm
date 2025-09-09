import { NextResponse } from 'next/server'

export async function POST() {
	// No-op until auth is implemented; return 204 No Content deterministically
	return new NextResponse(null, { status: 204 })
}
