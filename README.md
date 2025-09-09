Production‑ready Next.js app with a modular MCP (Model Context Protocol) client and dashboards. All UI uses shadcn/ui components only; no demo data in production paths.

## Environment Setup

### 1. Copy Environment Template

Create a clean env from the template:

```bash
cp .env.example .env # then fill values or use .env.local for secrets
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

### 6. Domain & MCP Configuration

This project targets WSS servers under your domain. Set MCP_* in env to point to your runtime. We do not ship fallbacks; errors surface in-app and the UI continues.

#### MCP Server Endpoints:
- Base host: `api.digitalhustlelab.com`
- **Remote Server**: `api.digitalhustlelab.com:3001`
- **Web Scraper Server**: `api.digitalhustlelab.com:3002`
- **Database Connector Server**: `api.digitalhustlelab.com:3003`
- **AI Assistant Server**: `api.digitalhustlelab.com:3004`
- **API Integrator Server**: `api.digitalhustlelab.com:3005`

#### WebSocket Endpoints:
- **File System**: `wss://api.digitalhustlelab.com:3001`
- **Web Search**: `wss://api.digitalhustlelab.com:3002`
- **Database**: `wss://api.digitalhustlelab.com:3003`

Authoritative server tree is `servers/`. Legacy copies live under `mcp/backup/` for reference only. Source‑of‑truth config lives in `mcp/config/`.

Frontend MCP client lives under `lib/mcp/**`:
- `client/` connection manager, tool executor (HTTP today, WS-ready), health monitor.
- `tools/` category modules. By design, tool handlers throw typed MCP errors until live servers are reachable.
- `hooks/` use-mcp, use-mcp-tools, use-mcp-servers, use-mcp-health.
- `app/api/mcp/*` typed HTTP proxy with strict error mapping.

## Features

### Party Line Chat Interface
- **Multi-Provider Support**: Seamlessly switch between OpenAI, Anthropic, Groq, and custom models
- **Real-time Streaming**: Experience real-time AI responses as they're generated
- **Model Selection**: Choose from 15+ AI models with different capabilities
- **Character/Personas**: AI personalities (Assistant, Teacher, Code Expert, Creative Writer)
- **Settings Panel**: Configure temperature, max tokens, and API keys
- **Auto-scrolling**: Chat automatically scrolls to show new messages
- **Error Handling**: Graceful error handling with user-friendly messages

### Dashboard Tabs (shadcn/ui)
- Party Line (multi-chat, multi-model)
- MCP
   - Hosting (public servers)
   - Personal (owner tools)
   - Tools (list + execute dialog)
   - Control (manager actions; auth-gated when enabled)

All panels are modular (<50 lines/file target). Errors pop as toasts via the global error bus.
- **Text Chat**: Standard conversational AI
- **Streaming Responses**: Real-time token streaming
- **Model Switching**: Instant model switching without restart
- **Custom Endpoints**: Support for custom API endpoints and proxies
- **Environment Variables**: Secure API key management
- **TypeScript**: Full type safety and IntelliSense support

## Usage

1. **Start the development server:**
   ```bash
   pnpm dev
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

You can start editing by modifying `app/dashboard/page.tsx` and components under `components/`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## MCP Tooling (224+ tools)

This workspace has 200+ callable tools available to the agent runtime (VS Code MCP extensions like memory, playwright, context7, github, fetch, etc.). The app integrates with them via:
- HTTP proxy routes: `GET /api/mcp/tools`, `POST /api/mcp/tools/[toolId]/execute`
- WebSocket JSON‑RPC client (ready in `lib/mcp/client/websocket-handler.ts`)

When your remote servers are up, set the WSS URLs in env and the UI will surface real data. Until then, handlers throw `MCPServerUnavailableError` with a helpful hint; the toast shows the error and the app remains usable.

## Security & Ops (summary)
- Auth is coded (JWT stubs) but bypassed for now. Flip on once Supabase is configured.
- Deterministic, typed errors; no fallbacks.
- Rate limits/quotas, metrics, and alerts live in Python servers; see `PROJECT_RULES.md` for phases.
