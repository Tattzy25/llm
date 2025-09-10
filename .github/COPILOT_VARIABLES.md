# GitHub Repository Variables for Copilot

## To set these in GitHub:
1. Go to your repository: https://github.com/Tattzy25/llm
2. Click Settings → Secrets and variables → Actions
3. Click "Variables" tab
4. Add these variables:

## Development Variables
- `COPILOT_DEV_MODE`: `true`
- `NODE_VERSION`: `18`
- `PACKAGE_MANAGER`: `pnpm`
- `BUILD_COMMAND`: `pnpm build`
- `DEV_COMMAND`: `pnpm dev`

## Project Context Variables  
- `FRAMEWORK`: `Next.js 15.5.2`
- `TYPESCRIPT_STRICT`: `true`
- `UI_LIBRARY`: `shadcn/ui`
- `STYLING`: `Tailwind CSS`

## Priority Tasks
- `PRIORITY_1`: `fix-build-errors`
- `PRIORITY_2`: `create-env-template`
- `PRIORITY_3`: `implement-auth-bypass`

## File Patterns to Focus On
- `CRITICAL_FILES`: `components/character-selector.tsx,lib/mcp/**/*.ts`
- `CONFIG_FILES`: `.env.example,next.config.ts`
- `AUTH_FILES`: `app/api/auth/**/*.ts`
