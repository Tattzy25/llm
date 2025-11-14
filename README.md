# Digital Hustle Lab - LLM Application

A powerful Next.js 15.5.2 application for interacting with multiple AI language models through a unified interface. Features character-based personas, MCP (Model Context Protocol) server integration, and a modern dashboard UI.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 9.0.0+ (required - do not use npm or yarn)
- Python 3.13.7 (for MCP servers)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd llm
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add at least one LLM provider API key:
   ```bash
   # At minimum, add one of these:
   OPENAI_API_KEY=your_actual_openai_key
   ANTHROPIC_API_KEY=your_actual_anthropic_key
   GROQ_API_KEY=your_actual_groq_key
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Features

### Multi-Provider LLM Support
- **OpenAI** - GPT-4, GPT-5, O3, O4-mini models
- **Anthropic** - Claude Sonnet 4
- **Groq** - Various open-source models with blazing fast inference
- **Google AI** - Gemini models
- **Cohere** - Cohere models
- **Local Models** - Ollama support for local inference

### Character System
Create AI personas with customizable:
- Personality traits (creativity, empathy, humor, etc.)
- Capabilities (voice, image generation, code execution, etc.)
- Model preferences and settings
- System prompts and archetypes

### MCP Server Ecosystem
Python-based Model Context Protocol servers for:
- Desktop integration
- File system access
- Custom tool execution
- WebSocket-based real-time communication

### Modern UI
- Dark/Light theme support
- Responsive dashboard layout
- Real-time chat interface
- Model and API key management
- Image upload and conversion tools

## 📁 Project Structure

```
llm/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main dashboard interface
│   ├── playground/        # MCP playground
│   ├── api/              # API routes
│   └── api-key/          # API key management
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── character-selector/  # Character management
│   ├── control-panel-robots/ # Dashboard UI
│   └── mcp-*/            # MCP integration components
├── lib/                   # Utility libraries
│   ├── chat-service.ts   # Multi-provider chat service
│   └── api-validation.ts # API key validation
├── servers/              # Python MCP servers
└── public/               # Static assets
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🌐 Deployment

### Build for Production

```bash
pnpm build
```

The build output will be in `.next/` directory.

### Environment Variables for Production

Required for production deployments:

```bash
# Security (required)
API_KEY_ENCRYPTION_SECRET=your_32_character_encryption_key
SESSION_SECRET=your_32_character_session_secret

# Database (optional but recommended)
DATABASE_URL=postgresql://user:password@host/database

# Redis (optional - for caching)
REDIS_URL=redis://host:port

# At least one LLM provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

### Deployment Platforms

This application can be deployed to:
- **Vercel** - Easiest deployment (with environment variables)
- **Netlify** - Full support for Next.js apps
- **Self-hosted** - Docker or traditional VPS
- **Cloudflare Pages** - With Node.js runtime

## 🗄️ Database Migration

### Moving from Supabase

If you have data in Supabase and want to migrate:

1. **Export your data** from Supabase
2. **Set up Neon PostgreSQL** (recommended alternative)
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string to `DATABASE_URL`

3. **Update database client** in `lib/database.ts` to use your new database

### Using Mixbreed for Real-time Data

For real-time data and search capabilities, consider using Mixbreed:
- Handles WebSocket connections
- Provides real-time updates
- Built-in search capabilities

## 🔐 API Key Management

1. Navigate to `/api-key` in the application
2. Add your API keys for each provider
3. Keys are stored locally in your browser
4. Validation status is shown for each key

## 🐛 Troubleshooting

### Build Fails

1. **Clear the build cache**
   ```bash
   rm -rf .next
   pnpm build
   ```

2. **Check environment variables**
   - Ensure `.env.local` exists
   - Verify placeholder values for unused services

### Development Server Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Module not found errors**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### MCP Server Issues

1. **Python dependencies**
   ```bash
   cd servers
   pip install -r requirements.txt  # if requirements.txt exists
   ```

2. **WebSocket connection fails**
   - Check Python server is running
   - Verify WebSocket URL in configuration

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [MCP Protocol](https://modelcontextprotocol.io)

## 🤝 Contributing

This is a personal project. Feel free to fork and customize for your needs.

## 📝 License

Private project - All rights reserved

## 🔄 Project Status

**✅ READY TO DEPLOY**

Current State:
- ✅ Build passing successfully
- ✅ Development server running
- ✅ Environment configuration complete
- ✅ All TypeScript errors resolved
- ✅ Modern dependencies (Next.js 15.5.2, React 19)

Last Updated: November 2024
