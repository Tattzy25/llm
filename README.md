This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure API Keys

Edit the `.env` file and add your API keys:

#### Required API Keys:

**OpenAI API Key**
- Get from: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Set: `OPENAI_API_KEY=your_key_here`

**Anthropic Claude API Key**
- Get from: [https://console.anthropic.com/](https://console.anthropic.com/)
- Set: `ANTHROPIC_API_KEY=your_key_here`

**Groq API Key**
- Get from: [https://console.groq.com/keys](https://console.groq.com/keys)
- Set: `GROQ_API_KEY=your_key_here`

**RelayAVI API Key** (Optional)
- Your custom API endpoint
- Set: `RELAYAVI_API_KEY=your_key_here`

### 3. Supported Models

The application supports multiple AI models across different providers:

#### OpenAI Models:
- `gpt-4`, `gpt-4.1`, `gpt-5-2025-08-07`
- `o3`, `o4-mini`
- `gpt-4o-mini-tts` (Text-to-Speech)

#### Anthropic Models:
- `claude-sonnet-4-20250514`

#### Groq Models:
- `openai/gpt-oss-120b`, `openai/gpt-oss-20b`
- `llama-3.3-70b-versatile`
- `groq/compound`, `groq/compound-mini`
- `meta-llama/llama-4-maverick-17b-128e-instruct`
- `meta-llama/llama-4-scout-17b-16e-instruct`

#### Custom Models:
- `relayavi/ollamik` (Your custom model)

### 4. Security Notes

⚠️ **Important Security Practices:**

- Never commit the `.env` file to version control
- Keep API keys secure and rotate them regularly
- Use different keys for development and production
- Consider using a secret management service for production deployments
- The `.env` file is already included in `.gitignore`

### 5. Optional Configuration

You can customize the following settings in your `.env` file:

```bash
# Default model
NEXT_PUBLIC_DEFAULT_MODEL=gpt-4

# Default temperature (0.0 - 2.0)
NEXT_PUBLIC_DEFAULT_TEMPERATURE=0.7

# Default max tokens
NEXT_PUBLIC_DEFAULT_MAX_TOKENS=4096

# Enable streaming
NEXT_PUBLIC_ENABLE_STREAMING=true

# Custom endpoints (if using proxies)
CUSTOM_OPENAI_ENDPOINT=https://api.openai.com/v1/chat/completions
CUSTOM_ANTHROPIC_ENDPOINT=https://api.anthropic.com/v1/messages
CUSTOM_GROQ_ENDPOINT=https://api.groq.com/openai/v1/chat/completions
```

## Features

### Party Line Chat Interface
- **Multi-Provider Support**: Seamlessly switch between OpenAI, Anthropic, Groq, and custom models
- **Real-time Streaming**: Experience real-time AI responses as they're generated
- **Model Selection**: Choose from 15+ AI models with different capabilities
- **Character/Personas**: AI personalities (Assistant, Teacher, Code Expert, Creative Writer)
- **Settings Panel**: Configure temperature, max tokens, and API keys
- **Auto-scrolling**: Chat automatically scrolls to show new messages
- **Error Handling**: Graceful error handling with user-friendly messages

### Supported Capabilities
- **Text Chat**: Standard conversational AI
- **Streaming Responses**: Real-time token streaming
- **Model Switching**: Instant model switching without restart
- **Custom Endpoints**: Support for custom API endpoints and proxies
- **Environment Variables**: Secure API key management
- **TypeScript**: Full type safety and IntelliSense support

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```

2. **Navigate to Party Line:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Click on "Party Line" in the sidebar

3. **Configure Settings:**
   - Click the settings (⚙️) icon
   - Enter your API keys for the providers you want to use
   - Select your preferred model
   - Adjust temperature and max tokens

4. **Start Chatting:**
   - Type your message in the input field
   - Press Enter or click Send
   - Watch real-time streaming responses

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
