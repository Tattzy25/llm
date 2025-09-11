import { supabase, imageSlugsDB } from '@/lib/database'
import { createClient } from '@supabase/supabase-js'

// Use service role key for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export interface ImageUploadResult {
  slug: string
  storageKey: string
  publicUrl: string
  contentType: string
  fileSize: number
}

/**
 * Generate a URL-friendly slug from a filename
 */
export function generateSlug(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // Remove file extension
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Upload an image to Supabase storage and create a slug mapping
 */
export async function uploadImageWithSlug(
  file: File,
  customSlug?: string,
  folder: 'Model_cards' | 'Provider_icons' = 'Model_cards'
): Promise<ImageUploadResult> {
  try {
    const bucketName = 'image_convert'
    const fileExt = file.name.split('.').pop() || 'jpg'
    const baseSlug = customSlug || generateSlug(file.name)

    // Ensure slug is unique
    let slug = baseSlug
    let counter = 1
    while (await imageSlugsDB.getBySlug(slug).catch(() => null)) {
      slug = `${baseSlug}-${counter}`
      counter++
      if (counter > 100) {
        throw new Error('Unable to generate unique slug')
      }
    }

    // Upload to storage
    const storageKey = `${folder}/${slug}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(storageKey, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    // Create slug mapping in database
    const slugRecord = await imageSlugsDB.create({
      slug,
      storage_key: storageKey,
      bucket_name: bucketName,
      content_type: file.type,
      file_size: file.size,
    })

    // Generate branded URL
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://digitalhustlelab.com'}/i/${slug}`

    return {
      slug,
      storageKey,
      publicUrl,
      contentType: file.type,
      fileSize: file.size,
    }
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

/**
 * Get the public URL for a slug
 */
export function getBrandedImageUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'https://digitalhustlelab.com'}/i/${slug}`
}

/**
 * List all image slugs
 */
export async function listImageSlugs() {
  return await imageSlugsDB.getAll()
}

/**
 * Delete an image slug and its associated file
 */
export async function deleteImageSlug(slug: string) {
  try {
    // Get the record first
    const record = await imageSlugsDB.getBySlug(slug)

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(record.bucket_name)
      .remove([record.storage_key])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await imageSlugsDB.delete(slug)

    return { success: true }
  } catch (error) {
    console.error('Image deletion error:', error)
    throw error
  }
}
