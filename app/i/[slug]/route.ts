import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { imageSlugsDB } from '@/lib/database'

// Use service role key for storage access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Validate slug format
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      )
    }

    // Look up the slug in the database
    const imageRecord = await imageSlugsDB.getBySlug(slug)

    if (!imageRecord) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Download the image from Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from(imageRecord.bucket_name)
      .download(imageRecord.storage_key)

    if (error || !data) {
      console.error('Storage download error:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve image' },
        { status: 500 }
      )
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer())

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', imageRecord.content_type || 'image/jpeg')
    headers.set('Content-Length', buffer.length.toString())
    headers.set('Cache-Control', 'public, max-age=31536000, immutable') // 1 year cache
    headers.set('ETag', `"${slug}-${imageRecord.updated_at.getTime()}"`)

    // Return the image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error('Image serving error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
