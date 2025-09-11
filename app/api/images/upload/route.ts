import { NextResponse, NextRequest } from 'next/server'
import { uploadImageWithSlug } from '@/lib/image-slug-utils'

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
    const customSlug = formData.get('slug') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!['Model_cards', 'Provider_icons'].includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder. Must be Model_cards or Provider_icons' }, { status: 400 })
    }

    const results: any[] = []

    for (const file of files) {
      try {
        const result = await uploadImageWithSlug(file, customSlug, folder as 'Model_cards' | 'Provider_icons')
        results.push(result)
      } catch (error: any) {
        console.error(`Failed to upload ${file.name}:`, error)
        results.push({
          error: `Failed to upload ${file.name}: ${error.message}`,
          filename: file.name
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      uploaded: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length
    })
  } catch (e: any) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
