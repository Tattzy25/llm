"use client"

/**
 * MCP (Model Context Protocol) Configuration
 *
 * Environment-based configuration for MCP servers and connections.
 */

import type { MCPConfig } from './types'

// MCP Server configurations - PRODUCTION READY - NO FALLBACKS
export const MCP_CONFIG = {
  REMOTE_SERVER: {
    endpoint: process.env.MCP_REMOTE_SERVER_URL,
    httpUrl: process.env.MCP_REMOTE_SERVER_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
    timeout: 30000,
    retries: 0 // NO RETRIES - PRODUCTION READY
  } as MCPConfig,

  WEB_SCRAPER: {
    endpoint: process.env.MCP_WEB_SCRAPER_URL,
    httpUrl: process.env.MCP_WEB_SCRAPER_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
    timeout: 45000,
    retries: 0 // NO RETRIES - PRODUCTION READY
  } as MCPConfig,

  DATABASE: {
    endpoint: process.env.MCP_DATABASE_URL,
    httpUrl: process.env.MCP_DATABASE_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
    timeout: 60000,
    retries: 0 // NO RETRIES - PRODUCTION READY
  } as MCPConfig,

  AI_ASSISTANT: {
    endpoint: process.env.MCP_AI_ASSISTANT_URL,
    httpUrl: process.env.MCP_AI_ASSISTANT_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
    timeout: 120000,
    retries: 0 // NO RETRIES - PRODUCTION READY
  } as MCPConfig,

  SERVER_MANAGER: {
    endpoint: process.env.MCP_SERVER_MANAGER_URL,
    httpUrl: process.env.MCP_SERVER_MANAGER_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
    timeout: 30000,
    retries: 0 // NO RETRIES - PRODUCTION READY
  } as MCPConfig,

  // Built-in local servers - no external dependencies
  DESKTOP: {
    endpoint: 'ws://localhost:3001',
    httpUrl: 'http://localhost:3001',
    timeout: 30000,
    retries: 0
  } as MCPConfig,

  FILESYSTEM: {
    endpoint: 'builtin://filesystem',
    httpUrl: 'builtin://filesystem',
    timeout: 10000,
    retries: 0
  } as MCPConfig
}

// Global MCP settings
export const MCP_SETTINGS = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 5000,
  HEALTH_CHECK_INTERVAL: 30000,
  DEFAULT_TIMEOUT: 30000,
  ENABLE_AUTO_RECONNECT: true,
  ENABLE_HEALTH_CHECKS: true
}

// Environment detection
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'

// Dynamic configuration based on environment
export const getMCPConfig = () => {
  return {
    ...MCP_CONFIG,
    // Override with localhost in development if no env vars set
    ...(isDevelopment && !process.env.MCP_REMOTE_SERVER_URL && {
      REMOTE_SERVER: {
        ...MCP_CONFIG.REMOTE_SERVER,
        endpoint: 'ws://localhost:3001',
        httpUrl: 'http://localhost:3001'
      },
      WEB_SCRAPER: {
        ...MCP_CONFIG.WEB_SCRAPER,
  // Route through Server Manager WS proxy to the desktop/web-scraper server
  endpoint: 'ws://localhost:8000/ws/desktop',
  httpUrl: 'http://localhost:8000'
      },
      DATABASE: {
        ...MCP_CONFIG.DATABASE,
  endpoint: 'ws://localhost:8000/ws/database',
  httpUrl: 'http://localhost:8000'
      },
      AI_ASSISTANT: {
        ...MCP_CONFIG.AI_ASSISTANT,
  endpoint: 'ws://localhost:8000/ws/ai_assistant',
  httpUrl: 'http://localhost:8000'
      },
      SERVER_MANAGER: {
        ...MCP_CONFIG.SERVER_MANAGER,
  endpoint: 'ws://localhost:8000',
  httpUrl: 'http://localhost:8000'
      }
    })
  }
}
