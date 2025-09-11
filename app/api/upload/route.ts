import { NextResponse, NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const tag = formData.get('tag') as string | null
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const urls: string[] = []
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop() || 'png'
      const filename = `${tag ?? 'upload'}-${uuidv4()}.${fileExt}`
      
      try {
        // Upload to Vercel Blob
        const blob = await put(filename, file, {
          access: 'public',
        })
        
        urls.push(blob.url)
      } catch (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Failed to upload ${file.name}`)
      }
    }
    
    return NextResponse.json({ urls })
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Upload failed'
    console.error(errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
