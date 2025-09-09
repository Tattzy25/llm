"use client"

/**
 * MCP Error Handling Utilities
 *
 * Enhanced error handling for MCP operations.
 */

import type { MCPExecutionResult } from '../types'

// Error handling utilities
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public serverId?: string,
    public toolName?: string
  ) {
    super(message)
    this.name = 'MCPError'
  }
}

// Result wrapper for MCP operations
export const createResult = <T>(
  success: boolean,
  data?: T,
  error?: string
): MCPExecutionResult => ({
  success,
  data,
  error,
  executionTime: Date.now()
})
