/**
 * Secure API Key Management Utilities
 * Handles encryption, decryption, and validation of API keys in production
 */

import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Get encryption secret from environment variables
const getEncryptionSecret = (): string => {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET environment variable is required for production')
  }
  if (secret.length < 32) {
    throw new Error('API_KEY_ENCRYPTION_SECRET must be at least 32 characters long')
  }
  return secret
}

/**
 * Encrypt an API key for secure storage
 * @param apiKey - The plain text API key
 * @returns Encrypted API key string
 */
export const encryptApiKey = (apiKey: string): string => {
  if (process.env.NODE_ENV !== 'production') {
    // In development, return the key as-is (or with light obfuscation)
    return Buffer.from(apiKey).toString('base64')
  }

  try {
    const secret = getEncryptionSecret();
    const key = createHash('sha256').update(secret).digest();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(apiKey), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Failed to encrypt API key:', error)
    throw new Error('API key encryption failed')
  }
}

/**
 * Decrypt an API key for use
 * @param encryptedKey - The encrypted API key
 * @returns Decrypted API key string
 */
export const decryptApiKey = (encryptedKey: string): string => {
  if (process.env.NODE_ENV !== 'production') {
    // In development, decode the base64
    try {
      return Buffer.from(encryptedKey, 'base64').toString('utf8')
    } catch {
      return encryptedKey // Return as-is if not base64
    }
  }

  try {
    const secret = getEncryptionSecret();
    const key = createHash('sha256').update(secret).digest();
    const parts = encryptedKey.split(':');
    if (parts.length !== 2) throw new Error('Invalid encrypted key format');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Failed to decrypt API key:', error)
    throw new Error('API key decryption failed')
  }
}

/**
 * Create a secure hash of an API key for verification
 * @param apiKey - The API key to hash
 * @returns SHA-256 hash of the API key
 */
export const hashApiKey = (apiKey: string): string => {
  return createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Generate a cryptographically secure API key
 * @param prefix - The prefix for the API key (e.g., 'dhl_sk_')
 * @returns A secure API key
 */
export const generateSecureApiKey = (prefix: string = 'dhl_sk_'): string => {
  const keyLength = 48 // 48 bytes = 384 bits of entropy
  const randomPart = randomBytes(keyLength).toString('base64url')
  return `${prefix}${randomPart}`
}

/**
 * Validate API key format
 * @param apiKey - The API key to validate
 * @returns True if the key format is valid
 */
export const validateApiKeyFormat = (apiKey: string): boolean => {
  // Check for Digital Hustle Lab key format
  if (apiKey.startsWith('dhl_sk_')) {
    return apiKey.length >= 60 // Minimum length for security
  }
  
  // Check for OpenAI format
  if (apiKey.startsWith('sk-')) {
    return apiKey.length >= 40
  }
  
  // Check for Anthropic format
  if (apiKey.startsWith('sk-ant-')) {
    return apiKey.length >= 50
  }
  
  // Generic validation - at least 20 characters
  return apiKey.length >= 20
}

/**
 * Mask an API key for display (showing only first 4 and last 4 characters)
 * @param apiKey - The API key to mask
 * @returns Masked API key string
 */
export const maskApiKey = (apiKey: string): string => {
  if (apiKey.length <= 8) {
    return '••••••••'
  }
  return `${apiKey.substring(0, 8)}${'•'.repeat(Math.max(8, apiKey.length - 12))}${apiKey.substring(apiKey.length - 4)}`
}

/**
 * Securely wipe a string from memory (best effort)
 * @param str - The string to wipe
 */
export const secureWipe = (str: string): void => {
  if (typeof str === 'string') {
    // This is a best-effort approach in JavaScript
    // For true secure wiping, you'd need native modules
    try {
      const buffer = Buffer.from(str, 'utf8')
      buffer.fill(0)
    } catch {
      // Ignore errors, this is best effort
    }
  }
}

/**
 * Environment variable utility to get API keys
 */
export const getEnvApiKey = (provider: string): string | null => {
  const envKeys: Record<string, string> = {
    'dhl': process.env.DHL_API_KEY || '',
    'openai': process.env.OPENAI_API_KEY || '',
    'anthropic': process.env.ANTHROPIC_API_KEY || '',
    'groq': process.env.GROQ_API_KEY || '',
    'relayavi': process.env.RELAYAVI_API_KEY || ''
  }
  
  return envKeys[provider.toLowerCase()] || null
}

/**
 * Check if we're in a secure environment for API key operations
 */
export const isSecureEnvironment = (): boolean => {
  // Check if HTTPS is enabled in production
  if (process.env.NODE_ENV === 'production') {
    return process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0' && 
           ((process.env.VERCEL_URL?.startsWith('https://') ?? false) || 
            (process.env.NEXTAUTH_URL?.startsWith('https://') ?? false))
  }
  return true // Allow in development
}

/**
 * Rate limiting for API key operations
 */
class ApiKeyRateLimit {
  private attempts: Map<string, number[]> = new Map()
  private readonly maxAttempts = 5
  private readonly windowMs = 15 * 60 * 1000 // 15 minutes

  checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    const userAttempts = this.attempts.get(identifier) || []
    
    // Remove old attempts
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs)
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false // Rate limited
    }
    
    recentAttempts.push(now)
    this.attempts.set(identifier, recentAttempts)
    return true
  }
}

export const apiKeyRateLimit = new ApiKeyRateLimit()
