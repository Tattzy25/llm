# Deployment Guide - Digital Hustle Lab LLM

This guide will help you deploy your LLM application to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] At least one LLM provider API key added
- [ ] Build completes successfully (`pnpm build`)
- [ ] Local testing passed (`pnpm dev`)

## Option 1: Vercel (Recommended - Fastest)

### Steps:

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `OPENAI_API_KEY` (or other provider keys)
     - `API_KEY_ENCRYPTION_SECRET`
     - `SESSION_SECRET`
   - Click "Deploy"

4. **Or deploy via CLI**
   ```bash
   vercel
   # Follow the prompts
   vercel --prod
   ```

### Environment Variables in Vercel:

Go to Project Settings > Environment Variables and add:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
API_KEY_ENCRYPTION_SECRET=your_32_char_secret_here
SESSION_SECRET=your_32_char_secret_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Option 2: Netlify

### Steps:

1. **Create netlify.toml** (if not exists)
   ```toml
   [build]
     command = "pnpm build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Deploy**
   - Connect GitHub repository to Netlify
   - Set build command: `pnpm build`
   - Set Node version: `18` or higher
   - Add environment variables
   - Deploy

---

## Option 3: Self-Hosted (VPS/Cloud)

### Using PM2 for Process Management

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Create ecosystem file** (`ecosystem.config.js`)
   ```javascript
   module.exports = {
     apps: [{
       name: 'llm-app',
       script: 'node_modules/next/dist/bin/next',
       args: 'start',
       cwd: '/path/to/your/app',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   ```

4. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Set up Nginx reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Option 4: Docker

### Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install pnpm in builder
RUN npm install -g pnpm@9.0.0

# Build
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Update next.config.ts

Add `output: 'standalone'` to your config:

```typescript
const nextConfig = {
  output: 'standalone',
  // ... other config
}
```

### Build and Run

```bash
# Build image
docker build -t llm-app .

# Run container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  llm-app
```

---

## Database Setup (Optional)

If you need persistent storage:

### Neon PostgreSQL (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy connection string
4. Add to environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

### Redis (For Caching)

1. Sign up at [upstash.com](https://upstash.com) (free tier available)
2. Create a Redis database
3. Add to environment variables:
   ```
   REDIS_URL=redis://...
   ```

---

## Post-Deployment

### 1. Test Your Deployment

- Visit your deployed URL
- Test chat functionality with each provider
- Check API key management page
- Verify MCP connections (if using)

### 2. Monitor Performance

- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor API usage and costs
- Check response times

### 3. Security

- Enable HTTPS (automatic on Vercel/Netlify)
- Set strong encryption secrets
- Rotate API keys periodically
- Monitor for unusual activity

---

## Environment Variables Reference

### Required
- `OPENAI_API_KEY` or other provider key (at least one)
- `API_KEY_ENCRYPTION_SECRET` (32+ characters)
- `SESSION_SECRET` (32+ characters)

### Optional
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXT_PUBLIC_APP_URL` - Your app's URL
- `ANTHROPIC_API_KEY` - Claude API
- `GROQ_API_KEY` - Groq API
- `GOOGLE_API_KEY` - Google AI
- `COHERE_API_KEY` - Cohere API

### Legacy (Can be removed)
- `NEXT_PUBLIC_SUPABASE_URL` - Old Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Old Supabase key
- `SUPABASE_SERVICE_ROLE_KEY` - Old Supabase service key

---

## Troubleshooting

### Build Fails on Platform

1. **Check Node version** - Must be 18+
2. **Verify pnpm is used** - Add `.npmrc` with `package-manager=pnpm@9.0.0`
3. **Check environment variables** - All required vars must be set

### Runtime Errors

1. **API key errors** - Verify keys are valid and not expired
2. **Database connection** - Check DATABASE_URL format
3. **Memory issues** - Increase instance size or optimize build

### Performance Issues

1. **Enable caching** - Use Redis for API responses
2. **Use CDN** - For static assets
3. **Optimize images** - Use Next.js Image component
4. **Monitor API calls** - Implement rate limiting

---

## Scaling Considerations

- Use serverless functions for API routes
- Implement caching with Redis
- Use CDN for static assets
- Monitor costs and set spending limits on API providers
- Consider edge functions for global low-latency

---

## Support

For issues or questions:
1. Check the README.md
2. Review Next.js documentation
3. Check provider API documentation
4. Review application logs

**Your app is now ready to deploy! 🚀**
