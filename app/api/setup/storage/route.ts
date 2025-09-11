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
    const { data, error } = await supabaseAdmin.storage.createBucket('images', { public: true });
    if (error) {
      console.error('Setup bucket error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  return NextResponse.json({ success: true, bucket: data?.name || 'images' });
  } catch (e: any) {
    console.error('Unexpected setup error:', e);
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
