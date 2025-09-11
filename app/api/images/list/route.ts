import { NextResponse } from 'next/server'
import { listImageSlugs, getBrandedImageUrl } from '@/lib/image-slug-utils'

export async function GET() {
  try {
    const slugs = await listImageSlugs()

    // Add branded URLs to the response
    const enrichedSlugs = slugs.map(slug => ({
      ...slug,
      brandedUrl: getBrandedImageUrl(slug.slug),
      directStorageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${slug.bucket_name}/${slug.storage_key}`
    }))

    return NextResponse.json({
      success: true,
      images: enrichedSlugs,
      total: enrichedSlugs.length
    })
  } catch (e: any) {
    console.error('List images error:', e)
    return NextResponse.json({ error: e.message || 'Failed to list images' }, { status: 500 })
  }
}
