"use client"

/**
 * MCP (Model Context Protocol) Main Module
 *
 * Unified interface for MCP functionality.
 * Provides easy access to all MCP features through a single import.
 */

// Core modules
export * from './types'
export * from './config'
export * from './utils'
export * from './client/index'
export * from './tools/index'
export * from './manager'
export * from './hooks'

// Re-export commonly used functions and classes
export { getMCPManager, startMCPServers, executeMCPTool, getMCPServerStatus, getMCPSystemHealth, getMCPTools } from './manager'
export { getMCPConfig } from './config'
export { MCPClient } from './client/index'
export { ALL_MCP_TOOLS, getToolsByCategory, getToolByName, getToolsByServer } from './tools/index'

// Default export for convenience
import { getMCPManager } from './manager'
export default getMCPManager()

// Quick start helper
export const initializeMCP = async () => {
  const manager = getMCPManager()
  console.log('Initializing MCP system...')
  const results = await manager.startAllServers()
  const successCount = results.filter(r => r.success).length
  console.log(`MCP initialization complete: ${successCount}/${results.length} servers started`)
  return results
}

// Health check helper
export const checkMCPHealth = async () => {
  const manager = getMCPManager()
  return await manager.getSystemHealth()
}

// Tool execution helper
export const runMCPTool = async (toolName: string, params: Record<string, unknown> = {}) => {
  const manager = getMCPManager()
  return await manager.executeTool(toolName, params)
}
