import { NextResponse, NextRequest } from 'next/server'
import { deleteImageSlug } from '@/lib/image-slug-utils'

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 })
    }

    await deleteImageSlug(slug)

    return NextResponse.json({
      success: true,
      message: `Image with slug '${slug}' deleted successfully`
    })
  } catch (e: any) {
    console.error('Delete image error:', e)
    return NextResponse.json({ error: e.message || 'Failed to delete image' }, { status: 500 })
  }
}
