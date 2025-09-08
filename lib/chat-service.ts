// lib/chat-service.ts

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  apiKey?: string
  endpoint?: string
  character?: string
  stream?: boolean
  timeout?: number
  retryAttempts?: number
}

export interface APIProvider {
  name: string
  baseUrl: string
  authHeader: string
  authPrefix: string
  models: string[]
  rateLimit?: {
    requests: number
    windowMs: number
  }
}

export class ChatService {
  private settings: ChatSettings
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map()

  // Production-grade API provider configurations
  private static readonly PROVIDERS: Record<string, APIProvider> = {
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      authHeader: 'Authorization',
      authPrefix: 'Bearer',
      models: ['gpt-4', 'gpt-4.1', 'gpt-5-2025-08-07', 'o3', 'o4-mini', 'gpt-4o-mini-tts'],
      rateLimit: { requests: 100, windowMs: 60000 } // 100 requests per minute
    },
    anthropic: {
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      authHeader: 'x-api-key',
      authPrefix: '',
      models: ['claude-sonnet-4-20250514'],
      rateLimit: { requests: 50, windowMs: 60000 } // 50 requests per minute
    },
    groq: {
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      authHeader: 'Authorization',
      authPrefix: 'Bearer',
      models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'groq/compound', 'groq/compound-mini', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct'],
      rateLimit: { requests: 30, windowMs: 60000 } // 30 requests per minute
    },
    relayavi: {
      name: 'RelayAVI',
      baseUrl: 'https://api.relayavi.com/v1',
      authHeader: 'Authorization',
      authPrefix: 'Bearer',
      models: ['relayavi/ollamik'],
      rateLimit: { requests: 100, windowMs: 60000 }
    },
    local: {
      name: 'Local',
      baseUrl: 'http://localhost:11434',
      authHeader: '',
      authPrefix: '',
      models: ['gpt-oss-20b', 'gpt-oss-120b', 'deepseek-r1:671b', 'gemma3:27b', 'llama3:70b'],
      rateLimit: { requests: 1000, windowMs: 60000 } // Higher limit for local
    }
  }

  constructor(settings: ChatSettings) {
    this.settings = {
      timeout: 30000, // 30 second default timeout
      retryAttempts: 3, // 3 retry attempts by default
      ...settings
    }

    // Validate environment setup
    this.validateEnvironment()
  }

  private validateEnvironment(): void {
    const requiredEnvVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GROQ_API_KEY']
    const missingVars: string[] = []

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar] || process.env[envVar]?.startsWith('your_')) {
        missingVars.push(envVar)
      }
    }

    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing or placeholder API keys: ${missingVars.join(', ')}`)
      console.warn('Please set these in your .env file for full functionality')
    }
  }

  private getProvider(model: string): APIProvider | null {
    for (const [key, provider] of Object.entries(ChatService.PROVIDERS)) {
      if (provider.models.includes(model) || model.startsWith(key + '/')) {
        return provider
      }
    }
    return null
  }

  private async checkRateLimit(provider: APIProvider): Promise<void> {
    if (!provider.rateLimit) return

    const now = Date.now()
    const key = provider.name
    const limiter = this.rateLimiters.get(key)

    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(key, { count: 1, resetTime: now + provider.rateLimit.windowMs })
      return
    }

    if (limiter.count >= provider.rateLimit.requests) {
      const waitTime = limiter.resetTime - now
      throw new Error(`Rate limit exceeded for ${provider.name}. Try again in ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    limiter.count++
  }

  private async makeRequestWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.settings.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Handle rate limiting
      if (response.status === 429) {
        if (retryCount < (this.settings.retryAttempts || 3)) {
          const retryAfter = response.headers.get('retry-after')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.makeRequestWithRetry(url, options, retryCount + 1)
        }
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      // Handle other retryable errors
      if (response.status >= 500 && retryCount < (this.settings.retryAttempts || 3)) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeRequestWithRetry(url, options, retryCount + 1)
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.settings.timeout}ms`)
      }
      throw error
    }
  }

  async sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string> {
    const systemMessage = this.getSystemMessage()
    const messages: ChatMessage[] = []

    if (systemMessage) {
      messages.push({
        id: 'system',
        content: systemMessage,
        role: 'assistant',
        timestamp: new Date()
      })
    }

    messages.push({
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    })

    try {
      const response = await this.callAPI(messages, onChunk)
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown chat error occurred'
      console.error('[ChatService] Error:', errorMessage)

      // Re-throw with enhanced error message
      throw new Error(`[${this.getProvider(this.settings.model)?.name || 'Unknown'}] ${errorMessage}`)
    }
  }

  // Get provider information for debugging
  getProviderInfo(): { name: string; baseUrl: string; models: string[] } | null {
    const provider = this.getProvider(this.settings.model)
    return provider ? {
      name: provider.name,
      baseUrl: provider.baseUrl,
      models: provider.models
    } : null
  }

  // Check if current configuration is valid
  isValidConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const provider = this.getProvider(this.settings.model)

    if (!provider) {
      errors.push(`Unsupported model: ${this.settings.model}`)
    }

    const envKey = provider ? this.getEnvKeyForProvider(provider) : ''
    if (envKey) {
      const apiKey = process.env[envKey]
      if (!apiKey || apiKey.startsWith('your_')) {
        errors.push(`Missing API key: ${envKey}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  private getSystemMessage(): string | null {
    const { character } = this.settings

    switch (character) {
      case 'teacher':
        return 'You are a helpful and patient teacher. Explain concepts clearly and provide examples when appropriate.'
      case 'coder':
        return 'You are an expert software developer. Provide clean, efficient code solutions with explanations.'
      case 'creative':
        return 'You are a creative writing assistant. Help with storytelling, poetry, and imaginative content.'
      case 'assistant':
      default:
        return null
    }
  }

  private async callAPI(messages: ChatMessage[], onChunk?: (chunk: string) => void): Promise<string> {
    const { model, apiKey, endpoint } = this.settings

    // Get provider configuration
    const provider = this.getProvider(model)
    if (!provider) {
      throw new Error(`Unsupported model: ${model}`)
    }

    // Check rate limits
    await this.checkRateLimit(provider)

    // Get API key from environment or settings
    let authKey = apiKey
    if (!authKey) {
      const envKey = this.getEnvKeyForProvider(provider)
      if (envKey) {
        authKey = process.env[envKey]
      }
    }

    if (!authKey || authKey.startsWith('your_')) {
      throw new Error(`API key not configured for ${provider.name}. Please set ${this.getEnvKeyForProvider(provider)} in your environment.`)
    }

    // Build endpoint URL
    const apiEndpoint = this.buildEndpoint(provider, endpoint)

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (provider.authHeader && authKey) {
      const prefix = provider.authPrefix ? `${provider.authPrefix} ` : ''
      headers[provider.authHeader] = `${prefix}${authKey}`
    }

    // Add provider-specific headers
    if (provider.name === 'Anthropic') {
      headers['anthropic-version'] = '2023-06-01'
    }

    const payload = this.buildPayload(messages, provider)

    try {
      const response = await this.makeRequestWithRetry(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${provider.name} API Error: ${response.status} - ${errorText}`)
      }

      if (onChunk && this.settings.stream) {
        return this.handleStreamingResponse(response, onChunk, provider)
      } else {
        return this.handleNonStreamingResponse(response, provider)
      }
    } catch (error) {
      console.error(`[${provider.name}] API call failed:`, error)
      throw error
    }
  }

  private getEnvKeyForProvider(provider: APIProvider): string {
    switch (provider.name) {
      case 'OpenAI': return 'OPENAI_API_KEY'
      case 'Anthropic': return 'ANTHROPIC_API_KEY'
      case 'Groq': return 'GROQ_API_KEY'
      case 'RelayAVI': return 'RELAYAVI_API_KEY'
      default: return ''
    }
  }

  private buildEndpoint(provider: APIProvider, customEndpoint?: string): string {
    if (customEndpoint) return customEndpoint

    const endpointMap: Record<string, string> = {
      'OpenAI': process.env.CUSTOM_OPENAI_ENDPOINT || `${provider.baseUrl}/chat/completions`,
      'Anthropic': process.env.CUSTOM_ANTHROPIC_ENDPOINT || `${provider.baseUrl}/messages`,
      'Groq': process.env.CUSTOM_GROQ_ENDPOINT || `${provider.baseUrl}/chat/completions`,
      'RelayAVI': process.env.RELAYAVI_ENDPOINT || `${provider.baseUrl}/chat/completions`,
      'Local': `${provider.baseUrl}/api/chat`
    }

    return endpointMap[provider.name] || provider.baseUrl
  }

  private buildPayload(messages: ChatMessage[], provider: APIProvider): Record<string, unknown> {
    const { model, temperature, maxTokens } = this.settings

    // Clean model name for API calls
    const cleanModel = model.replace(/^(openai|groq|claude|relayavi|meta-llama)\//, '')

    if (provider.name === 'Anthropic') {
      return {
        model: cleanModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: temperature,
        max_tokens: maxTokens,
        stream: !!this.settings.stream
      }
    } else {
      // OpenAI, Groq, and other OpenAI-compatible formats
      return {
        model: cleanModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: temperature,
        max_completion_tokens: maxTokens,
        stream: !!this.settings.stream
      }
    }
  }

  private async handleNonStreamingResponse(response: Response, provider: APIProvider): Promise<string> {
    const data = await response.json()

    if (provider.name === 'Anthropic') {
      return data.content?.[0]?.text || ''
    } else {
      // OpenAI, Groq, and other OpenAI-compatible formats
      return data.choices?.[0]?.message?.content || ''
    }
  }

  private async handleStreamingResponse(response: Response, onChunk: (chunk: string) => void, provider: APIProvider): Promise<string> {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    if (!reader) {
      throw new Error('No response body')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              return fullResponse
            }

            try {
              const parsed = JSON.parse(data)

              let content = ''
              if (provider.name === 'Anthropic') {
                content = parsed.delta?.text || ''
              } else {
                // OpenAI, Groq, and other OpenAI-compatible formats
                content = parsed.choices?.[0]?.delta?.content || ''
              }

              if (content) {
                fullResponse += content
                onChunk(content)
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullResponse
  }

  updateSettings(newSettings: Partial<ChatSettings>) {
    this.settings = { ...this.settings, ...newSettings }
  }
}

// Predefined model configurations
export const MODEL_CONFIGS = {
  // OpenAI Models
  'gpt-4': {
    name: 'GPT-4',
    maxTokens: 8192,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  'gpt-4.1': {
    name: 'GPT-4.1',
    maxTokens: 8192,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  'gpt-5-2025-08-07': {
    name: 'GPT-5 (2025-08-07)',
    maxTokens: 16384,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  'o3': {
    name: 'O3',
    maxTokens: 16384,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  'o4-mini': {
    name: 'O4 Mini',
    maxTokens: 4096,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  'gpt-4o-mini-tts': {
    name: 'GPT-4o Mini TTS',
    maxTokens: 4096,
    endpoint: 'https://api.openai.com/v1/audio/speech'
  },

  // Anthropic Models
  'claude-sonnet-4-20250514': {
    name: 'Claude Sonnet 4 (2025-05-14)',
    maxTokens: 8192,
    endpoint: 'https://api.anthropic.com/v1/messages'
  },

  // Groq API Models
  'openai/gpt-oss-120b': {
    name: 'OpenAI GPT-OSS 120B',
    maxTokens: 65536,
    contextWindow: 131072,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  'openai/gpt-oss-20b': {
    name: 'OpenAI GPT-OSS 20B',
    maxTokens: 65536,
    contextWindow: 131072,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  'llama-3.3-70b-versatile': {
    name: 'Llama 3.3 70B Versatile',
    maxTokens: 32768,
    contextWindow: 131072,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  'groq/compound': {
    name: 'Groq Compound',
    maxTokens: 8192,
    contextWindow: 131072,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  'groq/compound-mini': {
    name: 'Groq Compound Mini',
    maxTokens: 8192,
    contextWindow: 131072,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  'meta-llama/llama-4-maverick-17b-128e-instruct': {
    name: 'Meta Llama 4 Maverick 17B 128E Instruct',
    maxTokens: 8192,
    contextWindow: 131072,
    maxFileSize: '20 MB',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  'meta-llama/llama-4-scout-17b-16e-instruct': {
    name: 'Meta Llama 4 Scout 17B 16E Instruct',
    maxTokens: 8192,
    contextWindow: 131072,
    maxFileSize: '20 MB',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },

  // Ollama Local Models
  'relayavi/ollamik': {
    name: 'RelayAVI Ollamik',
    maxTokens: 4096,
    endpoint: 'https://api.relayavi.com/v1/chat/completions'
  },
  'gpt-oss-20b': {
    name: 'GPT-OSS 20B (Local)',
    maxTokens: 65536,
    contextWindow: 131072,
    endpoint: 'http://localhost:11434/api/chat'
  },
  'gpt-oss-120b': {
    name: 'GPT-OSS 120B (Local)',
    maxTokens: 65536,
    contextWindow: 131072,
    endpoint: 'http://localhost:11434/api/chat'
  },
  'deepseek-r1:671b': {
    name: 'DeepSeek R1 671B (Local)',
    maxTokens: 32768,
    endpoint: 'http://localhost:11434/api/chat'
  },
  'gemma3:27b': {
    name: 'Gemma 3 27B (Local)',
    maxTokens: 8192,
    endpoint: 'http://localhost:11434/api/chat'
  },
  'llama3:70b': {
    name: 'Llama 3 70B (Local)',
    maxTokens: 32768,
    contextWindow: 131072,
    endpoint: 'http://localhost:11434/api/chat'
  }
}

export interface ModelConfig {
  name: string
  maxTokens: number
  contextWindow?: number
  maxFileSize?: string
  endpoint: string
  provider?: string
}

// Custom model configurations (user can add their own)
export const CUSTOM_MODELS: Record<string, ModelConfig> = {}

// Function to add custom model
export function addCustomModel(modelId: string, config: ModelConfig) {
  CUSTOM_MODELS[modelId] = config
}

// Function to get all available models (predefined + custom)
export function getAllModels() {
  return { ...MODEL_CONFIGS, ...CUSTOM_MODELS }
}
