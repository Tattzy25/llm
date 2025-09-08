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
}

export class ChatService {
  private settings: ChatSettings

  constructor(settings: ChatSettings) {
    this.settings = settings
  }

  async sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string> {
    const systemMessage = this.getSystemMessage()
    const messages: ChatMessage[] = []

    if (systemMessage) {
      messages.push({
        id: 'system',
        content: systemMessage,
        role: 'assistant', // Using assistant role for system messages in some APIs
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
      console.error('Chat API error:', error)
      throw new Error('Failed to get response from AI')
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

    // Determine API provider and endpoint
    const isGroq = endpoint?.includes('groq.com') || model.startsWith('groq/')
    const isAnthropic = endpoint?.includes('anthropic.com') || model.startsWith('claude-')
    const isRelayAVI = model.startsWith('relayavi/')

    let apiEndpoint: string
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Get API key from environment variables or settings
    let authKey = apiKey
    if (!authKey) {
      if (isGroq) {
        authKey = process.env.GROQ_API_KEY
      } else if (isAnthropic) {
        authKey = process.env.ANTHROPIC_API_KEY
      } else if (isRelayAVI) {
        authKey = process.env.RELAYAVI_API_KEY
      } else {
        authKey = process.env.OPENAI_API_KEY
      }
    }

    if (isGroq) {
      apiEndpoint = endpoint || process.env.CUSTOM_GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions'
      if (authKey) {
        headers['Authorization'] = `Bearer ${authKey}`
      }
    } else if (isAnthropic) {
      apiEndpoint = endpoint || process.env.CUSTOM_ANTHROPIC_ENDPOINT || 'https://api.anthropic.com/v1/messages'
      if (authKey) {
        headers['x-api-key'] = authKey
        headers['anthropic-version'] = '2023-06-01'
      }
    } else if (isRelayAVI) {
      apiEndpoint = endpoint || process.env.RELAYAVI_ENDPOINT || 'https://api.relayavi.com/v1/chat/completions'
      if (authKey) {
        headers['Authorization'] = `Bearer ${authKey}`
      }
    } else {
      // OpenAI and other providers
      apiEndpoint = endpoint || process.env.CUSTOM_OPENAI_ENDPOINT || 'https://api.openai.com/v1/chat/completions'
      if (authKey) {
        headers['Authorization'] = `Bearer ${authKey}`
      }
    }

    const payload = this.buildPayload(messages, isGroq, isAnthropic)

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }

    if (onChunk) {
      return this.handleStreamingResponse(response, onChunk, isGroq, isAnthropic)
    } else {
      return this.handleNonStreamingResponse(response, isGroq, isAnthropic)
    }
  }

  private buildPayload(messages: ChatMessage[], isGroq: boolean, isAnthropic: boolean): Record<string, unknown> {
    const { model, temperature, maxTokens } = this.settings

    if (isAnthropic) {
      return {
        model: model.replace('claude-', ''),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: temperature,
        max_tokens: maxTokens,
        stream: !!this.settings.stream
      }
    } else {
      // OpenAI and Groq format
      return {
        model: model,
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

  private async handleNonStreamingResponse(response: Response, isGroq: boolean, isAnthropic: boolean): Promise<string> {
    if (isAnthropic) {
      const data = await response.json()
      return data.content[0]?.text || ''
    } else {
      // OpenAI and Groq format
      const data = await response.json()
      return data.choices[0].message.content
    }
  }

  private async handleStreamingResponse(response: Response, onChunk: (chunk: string) => void, isGroq: boolean, isAnthropic: boolean): Promise<string> {
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
              if (isAnthropic) {
                content = parsed.delta?.text || ''
              } else {
                // OpenAI and Groq format
                content = parsed.choices[0]?.delta?.content || ''
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
