/**
 * Production Environment Variables Service
 * Handles secure environment variable management and API key integration
 */

export interface EnvironmentConfig {
  // Core Application
  appName: string
  appUrl: string
  nodeEnv: string

  // API Endpoints
  dhlApiEndpoint: string
  openaiEndpoint: string
  anthropicEndpoint: string
  googleEndpoint: string
  cohereEndpoint: string

  // Security
  apiKeyEncryptionSecret?: string
  sessionSecret?: string
  corsOrigins: string[]

  // Rate Limiting
  rateLimitPerMinute: number
  rateLimitPerHour: number
  maxTokensPerRequest: number

  // Features
  enableCharacterCreation: boolean
  enableCustomModels: boolean
  enableApiKeyValidation: boolean
  enableRealTimeChat: boolean

  // Model Configuration
  defaultModelProvider: string
  defaultModelName: string
  defaultMaxTokens: number
  availableModels: string[]
}

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    // Core Application
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Digital Hustle Lab LLM',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',

    // API Endpoints
    dhlApiEndpoint: process.env.NEXT_PUBLIC_DHL_API_ENDPOINT || 'https://api.digitalhustlelab.com',
    openaiEndpoint: process.env.NEXT_PUBLIC_OPENAI_ENDPOINT || 'https://api.openai.com/v1',
    anthropicEndpoint: process.env.NEXT_PUBLIC_ANTHROPIC_ENDPOINT || 'https://api.anthropic.com/v1',
    googleEndpoint: process.env.NEXT_PUBLIC_GOOGLE_ENDPOINT || 'https://generativelanguage.googleapis.com/v1',
    cohereEndpoint: process.env.NEXT_PUBLIC_COHERE_ENDPOINT || 'https://api.cohere.ai/v1',

    // Security
    apiKeyEncryptionSecret: process.env.API_KEY_ENCRYPTION_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),

    // Rate Limiting
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60'),
    rateLimitPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '1000'),
    maxTokensPerRequest: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4096'),

    // Features
    enableCharacterCreation: process.env.ENABLE_CHARACTER_CREATION !== 'false',
    enableCustomModels: process.env.ENABLE_CUSTOM_MODELS !== 'false',
    enableApiKeyValidation: process.env.ENABLE_API_KEY_VALIDATION !== 'false',
    enableRealTimeChat: process.env.ENABLE_REAL_TIME_CHAT !== 'false',

    // Model Configuration
    defaultModelProvider: process.env.DEFAULT_MODEL_PROVIDER || 'openai',
    defaultModelName: process.env.DEFAULT_MODEL_NAME || 'gpt-4',
    defaultMaxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '2048'),
    availableModels: (process.env.AVAILABLE_MODELS || 'gpt-4,gpt-3.5-turbo,claude-3-opus').split(',')
  }

  return config
}

/**
 * Get API key from environment variables
 */
export function getApiKeyFromEnv(provider: string): string | undefined {
  switch (provider.toLowerCase()) {
    case 'openai':
      return process.env.OPENAI_API_KEY
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY
    case 'google':
    case 'gemini':
      return process.env.GOOGLE_API_KEY
    case 'cohere':
      return process.env.COHERE_API_KEY
    case 'digital-hustle-lab':
    case 'dhl':
      return process.env.DHL_API_SECRET_KEY
    default:
      return process.env[`${provider.toUpperCase()}_API_KEY`]
  }
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Get secure headers for production
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}

  if (process.env.ENABLE_SECURITY_HEADERS === 'true') {
    headers['X-Frame-Options'] = 'DENY'
    headers['X-Content-Type-Options'] = 'nosniff'
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    headers['X-XSS-Protection'] = '1; mode=block'
  }

  if (process.env.ENABLE_CSP === 'true') {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.cohere.ai https://api.digitalhustlelab.com",
      "frame-ancestors 'none'"
    ].join('; ')
  }

  return headers
}

/**
 * Validate required environment variables for production
 */
export function validateProductionEnvironment(): string[] {
  const errors: string[] = []

  if (isProduction()) {
    // Check required production variables
    const required = [
      'API_KEY_ENCRYPTION_SECRET',
      'SESSION_SECRET'
    ]

    for (const variable of required) {
      if (!process.env[variable]) {
        errors.push(`Missing required environment variable: ${variable}`)
      }
    }

    // Check API keys (at least one should be configured)
    const apiKeys = [
      process.env.OPENAI_API_KEY,
      process.env.ANTHROPIC_API_KEY,
      process.env.GOOGLE_API_KEY,
      process.env.COHERE_API_KEY,
      process.env.DHL_API_SECRET_KEY
    ]

    if (!apiKeys.some(key => key && key.length > 0)) {
      errors.push('At least one API key must be configured for production')
    }

    // Validate encryption secret length
    if (process.env.API_KEY_ENCRYPTION_SECRET && process.env.API_KEY_ENCRYPTION_SECRET.length < 32) {
      errors.push('API_KEY_ENCRYPTION_SECRET must be at least 32 characters long')
    }
  }

  return errors
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  return {
    url: process.env.DATABASE_URL,
    redis: process.env.REDIS_URL
  }
}

/**
 * Get monitoring configuration
 */
export function getMonitoringConfig() {
  return {
    sentryDsn: process.env.SENTRY_DSN,
    analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    logLevel: process.env.LOG_LEVEL || 'info'
  }
}

/**
 * Export current environment configuration
 */
export const environmentConfig = loadEnvironmentConfig()
