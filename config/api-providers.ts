/**
 * API Provider Configuration
 * Maps API keys to their respective endpoints and configurations
 */

export interface ApiProvider {
  id: string
  name: string
  description: string
  baseUrl: string
  keyPrefix: string
  authHeader: string
  maxTokens: number
  supportedModels: string[]
  features: string[]
}

export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
  requiredParams: string[]
  optionalParams: string[]
}

// Digital Hustle Lab API Configuration
export const DHL_API_CONFIG: ApiProvider = {
  id: 'dhl',
  name: 'Digital Hustle Lab',
  description: 'Official Digital Hustle Lab LLM API endpoints',
  baseUrl: process.env.NEXT_PUBLIC_DHL_API_BASE_URL || 'https://api.digitalhustlelab.com',
  keyPrefix: 'dhl_sk_',
  authHeader: 'Authorization',
  maxTokens: 8192,
  supportedModels: [
    'dhl-gpt-4',
    'dhl-gpt-3.5-turbo',
    'dhl-claude-3-opus',
    'dhl-claude-3-sonnet',
    'dhl-llama-3.1-70b',
    'dhl-mistral-large'
  ],
  features: [
    'chat_completions',
    'text_generation',
    'code_generation',
    'function_calling',
    'streaming',
    'embeddings'
  ]
}

// API Provider Registry
export const API_PROVIDERS: Record<string, ApiProvider> = {
  dhl: DHL_API_CONFIG,
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI GPT models and services',
    baseUrl: 'https://api.openai.com/v1',
    keyPrefix: 'sk-',
    authHeader: 'Authorization',
    maxTokens: 8192,
    supportedModels: ['gpt-4', 'gpt-3.5-turbo', 'text-davinci-003'],
    features: ['chat_completions', 'text_generation', 'embeddings', 'image_generation']
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude AI models by Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    keyPrefix: 'sk-ant-',
    authHeader: 'x-api-key',
    maxTokens: 100000,
    supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    features: ['chat_completions', 'text_generation', 'function_calling']
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference with Groq chips',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyPrefix: 'gsk_',
    authHeader: 'Authorization',
    maxTokens: 8192,
    supportedModels: ['llama-3.1-70b', 'mixtral-8x7b', 'gemma-7b'],
    features: ['chat_completions', 'text_generation', 'ultra_fast_inference']
  }
}

// API Endpoints for each provider
export const API_ENDPOINTS: Record<string, Record<string, ApiEndpoint>> = {
  dhl: {
    chat: {
      path: '/chat/completions',
      method: 'POST',
      description: 'Create a chat completion',
      requiredParams: ['model', 'messages'],
      optionalParams: ['temperature', 'max_tokens', 'stream', 'functions']
    },
    models: {
      path: '/models',
      method: 'GET',
      description: 'List available models',
      requiredParams: [],
      optionalParams: []
    },
    embeddings: {
      path: '/embeddings',
      method: 'POST',
      description: 'Create embeddings',
      requiredParams: ['model', 'input'],
      optionalParams: ['dimensions']
    },
    usage: {
      path: '/usage',
      method: 'GET',
      description: 'Get API usage statistics',
      requiredParams: [],
      optionalParams: ['start_date', 'end_date']
    }
  },
  openai: {
    chat: {
      path: '/chat/completions',
      method: 'POST',
      description: 'Create a chat completion',
      requiredParams: ['model', 'messages'],
      optionalParams: ['temperature', 'max_tokens', 'stream']
    },
    models: {
      path: '/models',
      method: 'GET',
      description: 'List available models',
      requiredParams: [],
      optionalParams: []
    }
  }
}

/**
 * Get API provider configuration by key prefix
 */
export const getProviderByKeyPrefix = (apiKey: string): ApiProvider | null => {
  for (const provider of Object.values(API_PROVIDERS)) {
    if (apiKey.startsWith(provider.keyPrefix)) {
      return provider
    }
  }
  return null
}

/**
 * Build API request configuration
 */
export const buildApiRequest = (
  apiKey: string,
  endpoint: string,
  data?: Record<string, unknown>,
  options?: RequestInit
): RequestInit => {
  const provider = getProviderByKeyPrefix(apiKey)
  if (!provider) {
    throw new Error('Invalid API key or unsupported provider')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'DigitalHustleLab-LLM/1.0.0',
    ...options?.headers
  }

  // Set the appropriate auth header
  if (provider.authHeader === 'Authorization') {
    headers['Authorization'] = `Bearer ${apiKey}`
  } else {
    headers[provider.authHeader] = apiKey
  }

  return {
    ...options,
    headers,
    body: data ? JSON.stringify(data) : options?.body
  }
}

/**
 * Get the full API URL for a provider and endpoint
 */
export const getApiUrl = (providerId: string, endpointKey: string): string => {
  const provider = API_PROVIDERS[providerId]
  const endpoint = API_ENDPOINTS[providerId]?.[endpointKey]
  
  if (!provider || !endpoint) {
    throw new Error(`Invalid provider or endpoint: ${providerId}/${endpointKey}`)
  }
  
  return `${provider.baseUrl}${endpoint.path}`
}

/**
 * Validate API key for a specific provider
 */
export const validateProviderApiKey = async (apiKey: string, providerId: string): Promise<boolean> => {
  try {
    const provider = API_PROVIDERS[providerId]
    if (!provider) return false
    
    if (!apiKey.startsWith(provider.keyPrefix)) return false
    
    // Make a simple test request to validate the key
    const url = getApiUrl(providerId, 'models')
    const response = await fetch(url, buildApiRequest(apiKey, 'models'))
    
    return response.ok
  } catch {
    return false
  }
}

// Environment variable integration
export const loadApiKeysFromEnv = (): Record<string, string> => {
  return {
    dhl: process.env.DHL_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    groq: process.env.GROQ_API_KEY || ''
  }
}
