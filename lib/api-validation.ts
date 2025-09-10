/**
 * Production-grade API key validation utilities
 * Validates API keys against actual provider endpoints
 */

export interface ApiValidationResult {
  isValid: boolean
  error?: string
  metadata?: {
    model?: string
    usage?: string | Record<string, unknown>
    rateLimit?: Record<string, unknown>
  }
}

/**
 * Validates API key with the actual provider endpoint
 */
export async function validateApiKeyWithProvider(
  provider: string, 
  apiKey: string
): Promise<boolean> {
  try {
    const result = await validateProviderApiKey(provider, apiKey)
    return result.isValid
  } catch (error) {
    console.error(`API key validation failed for ${provider}:`, error)
    return false
  }
}

/**
 * Validates API key against provider-specific endpoints
 */
async function validateProviderApiKey(
  provider: string, 
  apiKey: string
): Promise<ApiValidationResult> {
  
  // Validate API key format first
  if (!isValidApiKeyFormat(provider, apiKey)) {
    return {
      isValid: false,
      error: 'Invalid API key format'
    }
  }

  try {
    switch (provider.toLowerCase()) {
      case 'openai':
        return await validateOpenAIKey(apiKey)
      
      case 'anthropic':
        return await validateAnthropicKey(apiKey)
      
      case 'digital-hustle-lab':
      case 'dhl':
        return await validateDigitalHustleLabKey(apiKey)
      
      case 'google':
      case 'gemini':
        return await validateGoogleKey(apiKey)
      
      case 'cohere':
        return await validateCohereKey(apiKey)
      
      default:
        return await validateGenericKey(provider, apiKey)
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}

/**
 * Validates OpenAI API key
 */
async function validateOpenAIKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return {
        isValid: true,
        metadata: {
          model: data.data?.[0]?.id || 'Available',
          usage: 'Valid OpenAI API key'
        }
      }
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: 'Invalid OpenAI API key - Authentication failed'
      }
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: 'OpenAI API rate limit exceeded'
      }
    } else {
      return {
        isValid: false,
        error: `OpenAI API error: ${response.status}`
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Network error validating OpenAI key: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validates Anthropic API key
 */
async function validateAnthropicKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{
          role: 'user',
          content: 'test'
        }]
      })
    })

    if (response.ok || response.status === 400) {
      // 400 is expected for minimal test request
      return {
        isValid: true,
        metadata: {
          model: 'claude-3-haiku-20240307',
          usage: 'Valid Anthropic API key'
        }
      }
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: 'Invalid Anthropic API key - Authentication failed'
      }
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: 'Anthropic API rate limit exceeded'
      }
    } else {
      return {
        isValid: false,
        error: `Anthropic API error: ${response.status}`
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Network error validating Anthropic key: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validates Digital Hustle Lab API key
 */
async function validateDigitalHustleLabKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    // Use environment variable for DHL API endpoint
    const endpoint = process.env.NEXT_PUBLIC_DHL_API_ENDPOINT || 'https://api.digitalhustlelab.com'
    
    const response = await fetch(`${endpoint}/v1/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'validate_key'
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        isValid: true,
        metadata: {
          usage: data.usage || 'Valid DHL API key',
          rateLimit: data.rate_limit
        }
      }
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: 'Invalid Digital Hustle Lab API key - Authentication failed'
      }
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: 'Digital Hustle Lab API rate limit exceeded'
      }
    } else {
      return {
        isValid: false,
        error: `Digital Hustle Lab API error: ${response.status}`
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Network error validating DHL key: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validates Google/Gemini API key
 */
async function validateGoogleKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return {
        isValid: true,
        metadata: {
          model: data.models?.[0]?.name || 'Available',
          usage: 'Valid Google API key'
        }
      }
    } else if (response.status === 401 || response.status === 403) {
      return {
        isValid: false,
        error: 'Invalid Google API key - Authentication failed'
      }
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: 'Google API rate limit exceeded'
      }
    } else {
      return {
        isValid: false,
        error: `Google API error: ${response.status}`
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Network error validating Google key: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validates Cohere API key
 */
async function validateCohereKey(apiKey: string): Promise<ApiValidationResult> {
  try {
    const response = await fetch('https://api.cohere.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return {
        isValid: true,
        metadata: {
          model: data.models?.[0]?.name || 'Available',
          usage: 'Valid Cohere API key'
        }
      }
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: 'Invalid Cohere API key - Authentication failed'
      }
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: 'Cohere API rate limit exceeded'
      }
    } else {
      return {
        isValid: false,
        error: `Cohere API error: ${response.status}`
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Network error validating Cohere key: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Generic validation for custom providers
 */
async function validateGenericKey(provider: string, apiKey: string): Promise<ApiValidationResult> {
  // For custom providers, we can only validate format
  if (isValidApiKeyFormat(provider, apiKey)) {
    return {
      isValid: true,
      metadata: {
        usage: `Format validated for ${provider}`
      }
    }
  }
  
  return {
    isValid: false,
    error: `Invalid API key format for ${provider}`
  }
}

/**
 * Validates API key format based on provider
 */
function isValidApiKeyFormat(provider: string, apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false
  
  switch (provider.toLowerCase()) {
    case 'openai':
      return /^sk-[a-zA-Z0-9]{48,}$/.test(apiKey)
    
    case 'anthropic':
      return /^sk-ant-[a-zA-Z0-9_-]{95,}$/.test(apiKey)
    
    case 'digital-hustle-lab':
    case 'dhl':
      return /^dhl_sk_[a-zA-Z0-9]{32,}$/.test(apiKey)
    
    case 'google':
    case 'gemini':
      return /^[a-zA-Z0-9_-]{39}$/.test(apiKey)
    
    case 'cohere':
      return /^[a-zA-Z0-9]{40}$/.test(apiKey)
    
    default:
      // Generic validation - must be at least 10 chars, alphanumeric and common symbols
      return apiKey.length >= 10 && /^[a-zA-Z0-9_\-\.]+$/.test(apiKey)
  }
}

/**
 * Get API validation status message
 */
export function getValidationStatusMessage(isValid: boolean, error?: string): string {
  if (isValid) {
    return 'API key is valid and ready to use'
  }
  
  if (error) {
    return error
  }
  
  return 'API key validation failed'
}
