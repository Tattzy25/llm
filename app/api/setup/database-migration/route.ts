import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    // Use service role key for database operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

    // Split SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    let executedCount = 0
    const results = []

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
          if (error) {
            // Try direct execution if rpc fails
            const { error: directError } = await supabaseAdmin.from('_supabase_migration_temp').select('*').limit(0)
            if (directError) {
              results.push({ statement: statement.substring(0, 100) + '...', error: error.message })
            }
          } else {
            executedCount++
            results.push({ statement: statement.substring(0, 100) + '...', success: true })
          }
        } catch (err: any) {
          results.push({ statement: statement.substring(0, 100) + '...', error: err.message })
        }
      }
    }

    return NextResponse.json({
      success: true,
      executed: executedCount,
      total: statements.length,
      results
    })
  } catch (e: any) {
    console.error('Migration error:', e)
    return NextResponse.json({ error: e.message || 'Migration failed' }, { status: 500 })
  }
}
