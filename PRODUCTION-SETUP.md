# Production API Keys & Environment Variables Setup

This guide explains how to properly configure API keys and environment variables for production deployment of the Digital Hustle Lab LLM application.

## 🔐 Security-First Approach

This application implements **zero fallbacks** with strict error handling:
- ❌ No silent failures
- ✅ All errors show proper toast notifications
- ✅ Production-grade API key validation
- ✅ Encrypted storage and transmission
- ✅ Real endpoint validation (not just format checking)

## 📋 Quick Setup

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

```bash
# Core Security (REQUIRED for production)
API_KEY_ENCRYPTION_SECRET="your-32-character-secret-here"
SESSION_SECRET="your-session-secret-here"

# At least one API provider (REQUIRED)
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
DHL_API_SECRET_KEY="dhl_sk_your-dhl-key"
```

### 3. Generate Secure Secrets

```bash
# Generate encryption secret (32+ characters)
openssl rand -base64 32

# Generate session secret
openssl rand -hex 32
```

## 🔗 API Key Integration

### How API Keys Connect to Models

The application follows this architecture:

```
Character → Model → Provider → API Key
```

1. **User selects Character** (e.g., "Assistant", "Creative Writer")
2. **Character uses Model** (e.g., "gpt-4", "claude-3-opus")
3. **Model connects to Provider** (e.g., "OpenAI", "Anthropic")
4. **Provider uses API Key** from environment variables or user-managed keys

### API Key Priority

1. **User-managed keys** (from API Keys page) - highest priority
2. **Environment variables** - fallback for production
3. **Error notification** - no silent failures

### Provider Mapping

| Provider | Environment Variable | User Key Format |
|----------|---------------------|-----------------|
| OpenAI | `OPENAI_API_KEY` | `sk-...` |
| Anthropic | `ANTHROPIC_API_KEY` | `sk-ant-...` |
| Digital Hustle Lab | `DHL_API_SECRET_KEY` | `dhl_sk_...` |
| Google/Gemini | `GOOGLE_API_KEY` | `[39 chars]` |
| Cohere | `COHERE_API_KEY` | `[40 chars]` |

## ⚙️ Configuration Management

### API Keys Page Features

- **Real Validation**: Tests actual API endpoints
- **Secure Storage**: Keys are hashed and encrypted
- **Visual Feedback**: Clear success/error notifications
- **Copy Protection**: Auto-hide after copying
- **Delete Confirmation**: Prevents accidental removal

### Environment Variables Page Features

- **Vercel-style Interface**: Professional, clean design
- **Sensitive Toggle**: Auto-hide values for security
- **File Import**: Upload `.env` files
- **Search & Filter**: Find variables quickly
- **Inline Editing**: Update values in-place

## 🚀 Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard
2. Set required variables:
   ```
   API_KEY_ENCRYPTION_SECRET=your-secret
   SESSION_SECRET=your-session-secret
   OPENAI_API_KEY=your-openai-key
   ```

### Docker Deployment

```dockerfile
# Example environment variables
ENV API_KEY_ENCRYPTION_SECRET=your-secret
ENV SESSION_SECRET=your-session-secret
ENV OPENAI_API_KEY=your-openai-key
```

### Railway/Render Deployment

Add variables in the platform's environment section.

## 🛡️ Security Features

### API Key Validation

- **Real Endpoint Testing**: Makes actual API calls to validate
- **Format Validation**: Checks provider-specific formats
- **Rate Limit Handling**: Graceful handling of API limits
- **Error Reporting**: Clear error messages for troubleshooting

### Storage Security

- **Hashing**: Keys are hashed before storage
- **Encryption**: Sensitive data encrypted in transit
- **Local Storage**: User keys stored client-side only
- **Environment Separation**: Production keys server-side only

## 🔧 Development vs Production

### Development Mode
- Uses user-managed API keys from the UI
- Falls back to environment variables
- Shows detailed error messages
- Allows mock responses for testing

### Production Mode
- Prioritizes environment variables
- Strict validation requirements
- Security headers enabled
- Compressed assets and optimized performance

## 📱 User Experience

### Success Notifications
- ✅ "API key generated successfully"
- ✅ "Environment variable added"
- ✅ "Key copied to clipboard"

### Error Notifications
- ❌ "Invalid API key format"
- ❌ "Authentication failed"
- ❌ "Rate limit exceeded"
- ❌ "Network error - check connection"

### No Silent Failures
- Every operation provides clear feedback
- Failed validations show specific error messages
- Network issues are reported immediately
- Storage problems trigger user notifications

## 🔄 Model Integration

### Adding New Models

1. **Update Model Config** in `lib/chat-service.ts`
2. **Add Provider Support** in `lib/api-validation.ts`
3. **Configure Environment** variables
4. **Test Integration** with real API calls

### Custom Models

Custom models are persisted to localStorage for production use:
- Models survive browser restarts
- Settings are preserved per user
- Integration with character system
- Full validation and error handling

## 🆘 Troubleshooting

### Common Issues

1. **"API key validation failed"**
   - Check key format matches provider requirements
   - Verify internet connection
   - Ensure API key has sufficient permissions

2. **"Environment variable not found"**
   - Check `.env.local` file exists
   - Restart development server after changes
   - Verify variable names match exactly

3. **"Storage quota exceeded"**
   - Clear browser localStorage
   - Check available disk space
   - Reduce number of stored keys

### Debug Mode

Enable debug mode for detailed logging:
```bash
DEBUG_MODE=true
VERBOSE_LOGGING=true
```

## 📞 Support

For additional support:
- Check the console for detailed error messages
- Review network requests in browser dev tools
- Verify environment variables are loaded correctly
- Test API keys directly with provider documentation

---

**Remember**: This is a production-grade application with zero tolerance for silent failures. Every error will be properly reported through the notification system.
