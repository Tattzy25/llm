"use client"

/**
 * MCP Server Configurations
 *
 * Environment-based configuration for individual MCP servers.
 * PRODUCTION READY - NO FALLBACKS
 */

import type { MCPConfig } from '../types'

// REMOTE_SERVER Configuration - PRODUCTION READY
export const REMOTE_SERVER_CONFIG: MCPConfig = {
  endpoint: process.env.MCP_REMOTE_SERVER_URL,
  httpUrl: process.env.MCP_REMOTE_SERVER_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
  timeout: 30000,
  retries: 0 // NO RETRIES - PRODUCTION READY
}

// WEB_SCRAPER Configuration - PRODUCTION READY
export const WEB_SCRAPER_CONFIG: MCPConfig = {
  endpoint: process.env.MCP_WEB_SCRAPER_URL,
  httpUrl: process.env.MCP_WEB_SCRAPER_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
  timeout: 45000,
  retries: 0 // NO RETRIES - PRODUCTION READY
}

// DATABASE Configuration - PRODUCTION READY
export const DATABASE_CONFIG: MCPConfig = {
  endpoint: process.env.MCP_DATABASE_URL,
  httpUrl: process.env.MCP_DATABASE_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
  timeout: 60000,
  retries: 0 // NO RETRIES - PRODUCTION READY
}

// AI_ASSISTANT Configuration - PRODUCTION READY
export const AI_ASSISTANT_CONFIG: MCPConfig = {
  endpoint: process.env.MCP_AI_ASSISTANT_URL,
  httpUrl: process.env.MCP_AI_ASSISTANT_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
  timeout: 120000,
  retries: 0 // NO RETRIES - PRODUCTION READY
}

// SERVER_MANAGER Configuration - PRODUCTION READY
export const SERVER_MANAGER_CONFIG: MCPConfig = {
  endpoint: process.env.MCP_SERVER_MANAGER_URL,
  httpUrl: process.env.MCP_SERVER_MANAGER_URL?.replace('ws://', 'http://').replace('wss://', 'https://'),
  timeout: 30000,
  retries: 0 // NO RETRIES - PRODUCTION READY
}

// All server configurations
export const SERVER_CONFIGS = {
  REMOTE_SERVER: REMOTE_SERVER_CONFIG,
  WEB_SCRAPER: WEB_SCRAPER_CONFIG,
  DATABASE: DATABASE_CONFIG,
  AI_ASSISTANT: AI_ASSISTANT_CONFIG,
  SERVER_MANAGER: SERVER_MANAGER_CONFIG
}

// Get server configuration by ID
export const getServerConfig = (serverId: string): MCPConfig | null => {
  const config = SERVER_CONFIGS[serverId as keyof typeof SERVER_CONFIGS]
  return config || null
}

// Check if server is configured
export const isServerConfigured = (serverId: string): boolean => {
  const config = getServerConfig(serverId)
  return config?.endpoint ? true : false
}

// Get all configured servers
export const getConfiguredServers = (): Array<{ id: string; config: MCPConfig }> => {
  return Object.entries(SERVER_CONFIGS)
    .filter(([, config]) => config.endpoint)
    .map(([id, config]) => ({ id, config }))
}

// Get all server IDs
export const getAllServerIds = (): string[] => {
  return Object.keys(SERVER_CONFIGS)
}
