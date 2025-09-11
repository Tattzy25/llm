import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // Use service role key to bypass row-level security
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Create the image_convert bucket if it doesn't exist
    const { data, error } = await supabaseAdmin.storage.createBucket('image_convert', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 10485760 // 10MB limit
    });

    if (error) {
      // If bucket already exists, that's fine
      if (error.message.includes('already exists')) {
        return NextResponse.json({
          success: true,
          message: 'Bucket already exists',
          bucket: 'image_convert'
        });
      }
      console.error('Setup bucket error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bucket: data?.name || 'image_convert'
    });
  } catch (e: any) {
    console.error('Unexpected setup error:', e);
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
