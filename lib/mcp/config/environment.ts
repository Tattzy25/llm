"use client"

/**
 * MCP Environment Configuration
 *
 * Handles environment detection and dynamic configuration.
 * PRODUCTION READY - NO FALLBACKS
 */

import { SERVER_CONFIGS } from './server-configs'

// Environment detection
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'

// Dynamic configuration based on environment
export const getDynamicConfig = () => {
  // In production, only use environment variables - NO FALLBACKS
  if (isProduction) {
    return SERVER_CONFIGS
  }

  // In development, use localhost fallbacks ONLY if no env vars are set
  const config = { ...SERVER_CONFIGS }

  if (!process.env.MCP_REMOTE_SERVER_URL) {
    config.REMOTE_SERVER = {
      ...config.REMOTE_SERVER,
      endpoint: 'ws://localhost:3001',
      httpUrl: 'http://localhost:3001'
    }
  }

  if (!process.env.MCP_WEB_SCRAPER_URL) {
    config.WEB_SCRAPER = {
      ...config.WEB_SCRAPER,
      endpoint: 'ws://localhost:3002',
      httpUrl: 'http://localhost:3002'
    }
  }

  if (!process.env.MCP_DATABASE_URL) {
    config.DATABASE = {
      ...config.DATABASE,
      endpoint: 'ws://localhost:3003',
      httpUrl: 'http://localhost:3003'
    }
  }

  if (!process.env.MCP_AI_ASSISTANT_URL) {
    config.AI_ASSISTANT = {
      ...config.AI_ASSISTANT,
      endpoint: 'ws://localhost:3004',
      httpUrl: 'http://localhost:3004'
    }
  }

  if (!process.env.MCP_SERVER_MANAGER_URL) {
    config.SERVER_MANAGER = {
      ...config.SERVER_MANAGER,
      endpoint: 'ws://localhost:3000',
      httpUrl: 'http://localhost:3000'
    }
  }

  return config
}

// Environment validation
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (isProduction) {
    // In production, all environment variables must be set
    const requiredVars = [
      'MCP_REMOTE_SERVER_URL',
      'MCP_WEB_SCRAPER_URL',
      'MCP_DATABASE_URL',
      'MCP_AI_ASSISTANT_URL',
      'MCP_SERVER_MANAGER_URL'
    ]

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Get environment info
export const getEnvironmentInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    isProduction,
    isDevelopment,
    hasRemoteServerUrl: !!process.env.MCP_REMOTE_SERVER_URL,
    hasWebScraperUrl: !!process.env.MCP_WEB_SCRAPER_URL,
    hasDatabaseUrl: !!process.env.MCP_DATABASE_URL,
    hasAiAssistantUrl: !!process.env.MCP_AI_ASSISTANT_URL,
    hasServerManagerUrl: !!process.env.MCP_SERVER_MANAGER_URL
  }
}
