import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Upstash Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Database schemas
export interface ApiKeyRecord {
  id: string
  user_id: string
  name: string
  hashed_key: string
  masked_key: string
  last_used?: Date
  created_at: Date
  expires_at?: Date
  permissions?: string[]
  rate_limit?: number
}

export interface EnvironmentVariable {
  id: string
  user_id: string
  key: string
  value: string
  is_sensitive: boolean
  created_at: Date
  updated_at: Date
}

export interface CustomCharacter {
  id: string
  user_id: string
  name: string
  personality: string
  avatar_url?: string
  system_prompt: string
  created_at: Date
  is_active: boolean
}

export interface CustomModel {
  id: string
  user_id: string
  name: string
  provider: string
  model_id: string
  api_endpoint: string
  settings: Record<string, unknown>
  created_at: Date
  is_active: boolean
}

export interface ImageSlug {
  id: string
  slug: string
  storage_key: string
  bucket_name: string
  content_type?: string
  file_size?: number
  created_at: Date
  updated_at: Date
}

// API Keys Database Operations
export const apiKeysDB = {
  async create(apiKey: Omit<ApiKeyRecord, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        ...apiKey,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  async updateLastUsed(id: string) {
    const { error } = await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Environment Variables Database Operations
export const envVarsDB = {
  async create(envVar: Omit<EnvironmentVariable, 'id' | 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('environment_variables')
      .insert({
        ...envVar,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('environment_variables')
      .select('*')
      .eq('user_id', userId)
      .order('key', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async update(id: string, userId: string, updates: Partial<EnvironmentVariable>) {
    const { data, error } = await supabase
      .from('environment_variables')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('environment_variables')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Custom Characters Database Operations
export const charactersDB = {
  async create(character: Omit<CustomCharacter, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('custom_characters')
      .insert({
        ...character,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('custom_characters')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async update(id: string, userId: string, updates: Partial<CustomCharacter>) {
    const { data, error } = await supabase
      .from('custom_characters')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('custom_characters')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Custom Models Database Operations
export const modelsDB = {
  async create(model: Omit<CustomModel, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('custom_models')
      .insert({
        ...model,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('custom_models')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async update(id: string, userId: string, updates: Partial<CustomModel>) {
    const { data, error } = await supabase
      .from('custom_models')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('custom_models')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Image Slugs Database Operations
export const imageSlugsDB = {
  async create(slugData: Omit<ImageSlug, 'id' | 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('image_slugs')
      .insert({
        ...slugData,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('image_slugs')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) throw error
    return data
  },

  async getAll() {
    const { data, error } = await supabase
      .from('image_slugs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async update(slug: string, updates: Partial<ImageSlug>) {
    const { data, error } = await supabase
      .from('image_slugs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(slug: string) {
    const { error } = await supabase
      .from('image_slugs')
      .delete()
      .eq('slug', slug)
    
    if (error) throw error
  }
}

// Redis Cache Operations
export const cache = {
  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowMs: number) {
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000))
    }
    return current <= limit
  },

  // Session management
  async setSession(sessionId: string, data: Record<string, unknown>, ttlSeconds: number = 3600) {
    await redis.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(data))
  },

  async getSession(sessionId: string) {
    const data = await redis.get(`session:${sessionId}`)
    return data ? JSON.parse(data as string) : null
  },

  async deleteSession(sessionId: string) {
    await redis.del(`session:${sessionId}`)
  },

  // Model responses caching
  async cacheResponse(key: string, response: Record<string, unknown>, ttlSeconds: number = 300) {
    await redis.setex(`response:${key}`, ttlSeconds, JSON.stringify(response))
  },

  async getCachedResponse(key: string) {
    const data = await redis.get(`response:${key}`)
    return data ? JSON.parse(data as string) : null
  },

  // Real-time features
  async publishMessage(channel: string, message: Record<string, unknown>) {
    await redis.publish(channel, JSON.stringify(message))
  },

  // Usage tracking
  async trackUsage(userId: string, endpoint: string) {
    const key = `usage:${userId}:${endpoint}:${new Date().toISOString().slice(0, 10)}`
    await redis.incr(key)
    await redis.expire(key, 86400 * 30) // 30 days
  }
}

// Helper function to get current user ID (replace with your auth logic)
export async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  return user.id
}
