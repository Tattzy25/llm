"use client"

/**
 * MCP Tool Executor
 *
 * Handles tool execution via HTTP requests to MCP servers.
 * PRODUCTION READY - NO FALLBACKS, ENHANCED ERROR HANDLING
 */

import type { MCPExecutionResult } from '../types'
import { createLogger, withRetry, withTimeout, MCPError } from '../utils'

const logger = createLogger('MCP-ToolExecutor')

export class ToolExecutor {
  /**
   * Execute a tool on an MCP server
   */
  async executeTool(
    serverId: string,
    toolName: string,
    parameters: Record<string, unknown>,
    httpUrl: string,
    timeout: number = 30000,
    retries: number = 0 // PRODUCTION: NO RETRIES
  ): Promise<MCPExecutionResult> {
    try {
      const executeWithTimeout = withTimeout(
        this.makeHttpRequest(httpUrl, {
          tool: toolName,
          parameters
        }),
        timeout,
        `Tool execution timed out: ${toolName}`
      )

      const response = await withRetry(() => executeWithTimeout, retries)

      return {
        success: true,
        data: response,
        toolName,
        serverId,
        executionTime: Date.now()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Tool execution failed: ${toolName} on ${serverId}`, error as Error)

      return {
        success: false,
        error: errorMessage,
        toolName,
        serverId,
        executionTime: Date.now()
      }
    }
  }

  /**
   * Make HTTP request to MCP server
   */
  private async makeHttpRequest(url: string, data: { tool: string; parameters: Record<string, unknown> }): Promise<unknown> {
    const response = await fetch(`${url}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      // Enhanced error handling with more details
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorBody = await response.json()
        if (errorBody.message) {
          errorDetails += ` - ${errorBody.message}`
        }
      } catch {
        // If we can't parse error body, use status text
      }

      throw new MCPError(
        errorDetails,
        'HTTP_ERROR',
        undefined,
        data.tool
      )
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    } else {
      return response.text()
    }
  }

  /**
   * Validate tool parameters before execution
   */
  validateParameters(
    parameters: Record<string, unknown>,
    schema: Record<string, { required?: boolean; type: string }>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const [key, config] of Object.entries(schema)) {
      if (config.required && !(key in parameters)) {
        errors.push(`Missing required parameter: ${key}`)
      }

      if (key in parameters) {
        const value = parameters[key]
        const expectedType = config.type

        if (expectedType === 'string' && typeof value !== 'string') {
          errors.push(`Parameter ${key} must be a string, got ${typeof value}`)
        } else if (expectedType === 'number' && typeof value !== 'number') {
          errors.push(`Parameter ${key} must be a number, got ${typeof value}`)
        } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Parameter ${key} must be a boolean, got ${typeof value}`)
        } else if (expectedType === 'object' && (typeof value !== 'object' || value === null)) {
          errors.push(`Parameter ${key} must be an object, got ${typeof value}`)
        } else if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Parameter ${key} must be an array, got ${typeof value}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
