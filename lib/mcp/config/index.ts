"use client"

/**
 * MCP Configuration - Main Module
 *
 * Unified configuration interface for MCP servers and settings.
 */

import { SERVER_CONFIGS, getServerConfig, isServerConfigured, getConfiguredServers, getAllServerIds } from './server-configs'
import { getDynamicConfig, validateEnvironment, getEnvironmentInfo, isProduction, isDevelopment } from './environment'

// Global MCP settings
export const MCP_SETTINGS = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 5000,
  HEALTH_CHECK_INTERVAL: 30000,
  DEFAULT_TIMEOUT: 30000,
  ENABLE_AUTO_RECONNECT: false, // PRODUCTION: DISABLED
  ENABLE_HEALTH_CHECKS: true
}

// Get MCP configuration
export const getMCPConfig = () => {
  return getDynamicConfig()
}

// Legacy exports for backward compatibility
export const MCP_CONFIG = SERVER_CONFIGS

// Export all utilities
export {
  getServerConfig,
  isServerConfigured,
  getConfiguredServers,
  getAllServerIds,
  validateEnvironment,
  getEnvironmentInfo,
  isProduction,
  isDevelopment
}
