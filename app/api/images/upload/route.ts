import { NextResponse, NextRequest } from 'next/server'
import { uploadImageWithSlug, ImageUploadResult } from '@/lib/image-slug-utils'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const folder = (formData.get('folder') as string) || 'Model_cards'
    const customSlug = (formData.get('slug') as string) || undefined

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!['Model_cards', 'Provider_icons'].includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder. Must be Model_cards or Provider_icons' }, { status: 400 })
    }

    const results: Array<ImageUploadResult | { error: string; filename: string }> = []

    for (const file of files) {
      try {
        const result = await uploadImageWithSlug(file, customSlug, folder as 'Model_cards' | 'Provider_icons')
        results.push(result)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Failed to upload ${file.name}:`, error)
        results.push({
          error: `Failed to upload ${file.name}: ${errorMessage}`,
          filename: file.name
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      uploaded: results.filter(r => !('error' in r)).length,
      failed: results.filter(r => 'error' in r).length
    })
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Upload failed'
    console.error('Upload error:', e)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
