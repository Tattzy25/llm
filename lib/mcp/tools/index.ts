"use client"

/**
 * MCP Tools - Main Module
 *
 * Unified interface for all MCP tools across different categories.
 */

import type { MCPTool } from '../types'
import { WEB_SCRAPING_TOOLS } from './web-scraping'
import { DATABASE_TOOLS } from './database'
import { AI_ASSISTANT_TOOLS } from './ai-assistant'
import { SERVER_MANAGEMENT_TOOLS } from './server-management'

// Conditionally import server-side tools only when not in browser
let DESKTOP_TOOLS: MCPTool[] = []
let FILE_SYSTEM_TOOLS: MCPTool[] = []

// Dynamic import for server-side tools
if (typeof window === 'undefined') {
  try {
    import('./desktop').then(module => {
      DESKTOP_TOOLS = module.DESKTOP_TOOLS
    }).catch(() => {
      console.warn('Desktop tools not available')
    })
    import('./filesystem').then(module => {
      FILE_SYSTEM_TOOLS = module.FILE_SYSTEM_TOOLS
    }).catch(() => {
      console.warn('Filesystem tools not available')
    })
  } catch {
    console.warn('Server-side tools not available in client environment')
  }
}

// All tools combined
export const ALL_MCP_TOOLS = [
  ...WEB_SCRAPING_TOOLS,
  ...DATABASE_TOOLS,
  ...AI_ASSISTANT_TOOLS,
  ...SERVER_MANAGEMENT_TOOLS,
  ...DESKTOP_TOOLS,
  ...FILE_SYSTEM_TOOLS
]

// Tool categories
export const TOOL_CATEGORIES = {
  'web-scraping': WEB_SCRAPING_TOOLS,
  'database': DATABASE_TOOLS,
  'ai': AI_ASSISTANT_TOOLS,
  'management': SERVER_MANAGEMENT_TOOLS,
  'desktop': DESKTOP_TOOLS,
  'filesystem': FILE_SYSTEM_TOOLS
}

// Get tools by category
export const getToolsByCategory = (category: string): MCPTool[] => {
  return TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES] || []
}

// Get tool by name
export const getToolByName = (name: string): MCPTool | undefined => {
  return ALL_MCP_TOOLS.find(tool => tool.name === name)
}

// Get tools by server
export const getToolsByServer = (serverId: string): MCPTool[] => {
  return ALL_MCP_TOOLS.filter(tool => tool.serverId === serverId)
}

// Export individual tool arrays for backward compatibility
export { WEB_SCRAPING_TOOLS, DATABASE_TOOLS, AI_ASSISTANT_TOOLS, SERVER_MANAGEMENT_TOOLS, DESKTOP_TOOLS, FILE_SYSTEM_TOOLS }
