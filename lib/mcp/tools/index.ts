/**
 * MCP Tools - Main Module
 *
 * Unified interface for all MCP tools across different categories.
 * Isomorphic (safe for server and client imports).
 */

import type { MCPTool } from '../types'
import { WEB_SCRAPING_TOOLS } from './web-scraping'
import { DATABASE_TOOLS } from './database'
import { AI_ASSISTANT_TOOLS } from './ai-assistant'
import { SERVER_MANAGEMENT_TOOLS } from './server-management'

// Note: DESKTOP_TOOLS and FILE_SYSTEM_TOOLS are server-only and imported separately

// All client-safe tools combined
export const ALL_MCP_TOOLS = [
  ...WEB_SCRAPING_TOOLS,
  ...DATABASE_TOOLS,
  ...AI_ASSISTANT_TOOLS,
  ...SERVER_MANAGEMENT_TOOLS
]

// Tool categories
export const TOOL_CATEGORIES = {
  'web-scraping': WEB_SCRAPING_TOOLS,
  'database': DATABASE_TOOLS,
  'ai': AI_ASSISTANT_TOOLS,
  'management': SERVER_MANAGEMENT_TOOLS
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
export { WEB_SCRAPING_TOOLS, DATABASE_TOOLS, AI_ASSISTANT_TOOLS, SERVER_MANAGEMENT_TOOLS }
