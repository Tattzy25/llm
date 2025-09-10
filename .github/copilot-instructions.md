# GitHub Copilot Development Instructions

## Project Context
This is a Next.js 15.5.2 application with React 19, TypeScript, and Python MCP servers for AI chat interface with multiple model providers.

## Development Environment Setup
- **Package Manager**: Use `pnpm` (not npm or yarn)
- **Node Version**: 18+ 
- **Python Version**: 3.13.7
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS with shadcn/ui components

## Current Priority Issues
1. **Build Failures**: ESLint errors preventing deployment
2. **Missing Environment**: No .env.example template
3. **Authentication**: Needs bypass for development mode
4. **Database**: Supabase/Redis configuration missing
5. **MCP Servers**: External dependencies need local fallbacks

## Code Standards
- **TypeScript**: Avoid `any` types, use proper typing
- **React**: Use functional components with hooks
- **Imports**: Clean up unused imports
- **ESLint**: Fix all warnings and errors
- **File Size**: Keep components under 100 lines when possible

## File Structure Preferences
```
components/
├── ui/              # shadcn/ui components
├── [feature]/       # Feature-specific components
│   ├── index.tsx    # Main component
│   ├── types.ts     # TypeScript definitions
│   ├── hooks/       # Custom hooks
│   └── utils/       # Utility functions
```

## Build Commands
- Development: `pnpm dev`
- Build: `pnpm build`  
- Test: `pnpm test`
- Lint: `pnpm lint`

## Special Considerations
- **MCP Integration**: Maintain WebSocket connections to Python servers
- **Model Management**: Support OpenAI, Anthropic, Groq, and custom models
- **Character System**: AI personas with customizable capabilities
- **Authentication**: Currently bypassed for development (return mock user)

## Dependencies to Maintain
- Next.js 15.5.2
- React 19
- TypeScript 5.x
- Tailwind CSS 4.x
- shadcn/ui components
- Supabase client
- WebSocket connections

## Environment Variables Needed
```bash
# Required for production
API_KEY_ENCRYPTION_SECRET=
SESSION_SECRET=
DATABASE_URL=
REDIS_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# API Keys (at least one required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
COHERE_API_KEY=
```

## Current Blockers
- Build fails due to TypeScript/ESLint errors
- Missing .env.example file
- Authentication endpoints return 501
- External MCP server dependencies

## Development Workflow
1. Fix build errors first (critical)
2. Create environment template
3. Implement auth bypass
4. Configure database connections
5. Add local MCP fallbacks
