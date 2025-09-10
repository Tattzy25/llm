# API Keys & Environment Variables Setup Guide

## 🔐 Security Features

Your API Keys component includes **production-ready security features**:

### ✅ **Secure Key Generation**
- **Cryptographically secure random generation** using Web Crypto API
- **Base64URL encoding** (URL-safe, no padding)
- **48+ bytes of entropy** for maximum security
- **SHA-256 hashing** for verification without storing plain keys

### ✅ **Production Security**
- **AES-256-CBC encryption** for stored keys in production
- **Rate limiting** (5 attempts per 15 minutes)
- **Input validation** and format checking
- **Secure memory wiping** (best effort in JavaScript)
- **HTTPS enforcement** in production environments

### ✅ **Key Features**
- **Auto-expiring visibility** (keys auto-hide after 3 seconds)
- **Copy protection** with fallback methods
- **Masked display** (shows only first 8 and last 4 characters)
- **Format validation** for different provider key types

## 🚀 Quick Setup

### 1. Environment Variables Setup

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```bash
# Digital Hustle Lab API Keys (Generated from your ENV/API KEYS page)
DHL_API_KEY=dhl_sk_your_generated_api_key_here
DHL_SECRET_KEY=dhl_secret_your_secret_key_here

# Security (REQUIRED for production)
API_KEY_ENCRYPTION_SECRET=your_32_character_encryption_key_here_123456
NEXTAUTH_SECRET=your_nextauth_secret_here

# External AI Providers
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
GROQ_API_KEY=gsk_your_groq_key_here
```

### 2. Generate API Keys

1. **Navigate to ENV/API KEYS** in the sidebar
2. **Click "API Keys"** sub-option
3. **Enter a name** for your API key
4. **Click "Generate API Key"**
5. **Copy the key immediately** (it won't be shown again)

### 3. Configure Environment Variables

1. **Navigate to ENV/API KEYS** in the sidebar
2. **Click "Environment Variables"** sub-option
3. **Add key-value pairs** or **import .env files**
4. **Use the sensitive toggle** for API keys and secrets

## 🔗 API Provider Integration

### Supported Providers

| Provider | Key Prefix | Base URL | Features |
|----------|------------|----------|----------|
| **Digital Hustle Lab** | `dhl_sk_` | `https://api.digitalhustlelab.com` | Chat, Code Gen, Functions |
| **OpenAI** | `sk-` | `https://api.openai.com/v1` | GPT-4, Embeddings, Images |
| **Anthropic** | `sk-ant-` | `https://api.anthropic.com/v1` | Claude, Large Context |
| **Groq** | `gsk_` | `https://api.groq.com/openai/v1` | Ultra-fast Inference |

### Using API Keys in Code

```typescript
import { getProviderByKeyPrefix, buildApiRequest, getApiUrl } from '@/config/api-providers'

// Auto-detect provider from key
const provider = getProviderByKeyPrefix('dhl_sk_...')

// Build authenticated request
const requestConfig = buildApiRequest(apiKey, 'chat', {
  model: 'dhl-gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
})

// Make API call
const response = await fetch(
  getApiUrl('dhl', 'chat'),
  requestConfig
)
```

### Environment Variable Access

```typescript
import { loadApiKeysFromEnv } from '@/config/api-providers'

// Load all API keys from environment
const apiKeys = loadApiKeysFromEnv()
console.log(apiKeys.dhl) // Your DHL API key
console.log(apiKeys.openai) // Your OpenAI API key
```

## 🛡️ Security Best Practices

### ✅ **DO:**
- Generate a strong `API_KEY_ENCRYPTION_SECRET` (32+ characters)
- Use HTTPS in production (`NEXTAUTH_URL=https://...`)
- Rotate API keys regularly
- Monitor usage through the API Keys dashboard
- Use environment variables for different deployment stages

### ❌ **DON'T:**
- Commit `.env.local` to version control
- Share API keys in plain text
- Use the same keys across environments
- Store unencrypted keys in databases
- Skip the encryption secret in production

## 🔧 Advanced Configuration

### Custom API Providers

Edit `config/api-providers.ts` to add custom providers:

```typescript
export const API_PROVIDERS: Record<string, ApiProvider> = {
  // ... existing providers
  custom: {
    id: 'custom',
    name: 'Custom Provider',
    baseUrl: 'https://your-api.com/v1',
    keyPrefix: 'custom_',
    authHeader: 'Authorization',
    // ... other config
  }
}
```

### Environment-Specific Configuration

Create multiple environment files:
- `.env.local` - Local development
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

### Rate Limiting & Security

The API key system includes:
- **Rate limiting**: 5 attempts per 15 minutes per IP
- **Key validation**: Format and provider checks
- **Secure storage**: Encrypted in production
- **Access logging**: Track key usage and attempts

## 🚨 Production Deployment Checklist

- [ ] Set `API_KEY_ENCRYPTION_SECRET` (32+ chars)
- [ ] Set `NEXTAUTH_SECRET` for session security
- [ ] Enable HTTPS (`NEXTAUTH_URL=https://...`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure rate limiting
- [ ] Set up API key rotation schedule
- [ ] Monitor usage through dashboards
- [ ] Backup encryption keys securely

## 📞 Support

Need help? Your API key management system is fully integrated with:
- **Error boundaries** for graceful error handling
- **Toast notifications** for user feedback
- **Validation** for all inputs and formats
- **Fallback methods** for older browsers

The system automatically detects your environment and applies appropriate security measures.
