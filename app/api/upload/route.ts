import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/database'
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
    const bucket = 'images'
    const urls: string[] = []
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const fileExt = file.name.split('.').pop() || 'png'
      const filename = `${tag ?? 'upload'}-${uuidv4()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, Buffer.from(arrayBuffer), {
          contentType: file.type,
          upsert: false,
        })
      if (uploadError) {
        console.error('Upload error', uploadError)
        throw uploadError
      }
      // Retrieve the public URL for the uploaded file
      const { data } = supabase.storage.from(bucket).getPublicUrl(filename)
      if (!data?.publicUrl) {
        throw new Error('Failed to retrieve public URL')
      }
      urls.push(data.publicUrl)
    }
    return NextResponse.json({ urls })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
