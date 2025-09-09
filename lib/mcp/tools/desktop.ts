/**
 * Desktop Tools
 *
 * Built-in desktop automation tools that require server-side execution.
 */

import type { MCPTool } from '../types'

// Built-in Desktop Tools - NO EXTERNAL DEPENDENCIES
export const DESKTOP_TOOLS: MCPTool[] = [
  {
    name: 'read_file',
    description: 'Read file contents with optional offset and length',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'File path to read', required: true },
      offset: { type: 'number', description: 'Byte offset to start reading from', default: 0 },
      length: { type: 'number', description: 'Number of bytes to read', default: 1000 }
    },
    handler: async () => {
      // This will be handled by the MCP manager connecting to local desktop server
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'write_file',
    description: 'Write content to file',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'File path to write to', required: true },
      content: { type: 'string', description: 'Content to write', required: true },
      mode: { type: 'string', description: 'Write mode: overwrite or append', default: 'overwrite' }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'list_directory',
    description: 'List directory contents',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'Directory path to list', required: true }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'get_system_info',
    description: 'Get comprehensive system information',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {},
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'run_command',
    description: 'Run shell command safely',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      command: { type: 'string', description: 'Shell command to execute', required: true },
      cwd: { type: 'string', description: 'Working directory for command' }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'clipboard_operation',
    description: 'Clipboard operations: get, set, clear',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      action: { type: 'string', description: 'Action: get, set, or clear', required: true },
      content: { type: 'string', description: 'Content for set action' }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'send_notification',
    description: 'Send desktop notification',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      title: { type: 'string', description: 'Notification title', required: true },
      message: { type: 'string', description: 'Notification message', required: true }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'analyze_code_file',
    description: 'Analyze code file for insights and suggestions',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'Path to code file to analyze', required: true }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  },
  {
    name: 'get_file_hash',
    description: 'Get file hash for integrity checking',
    category: 'desktop',
    serverId: 'DESKTOP',
    parameters: {
      path: { type: 'string', description: 'File path to hash', required: true },
      algorithm: { type: 'string', description: 'Hash algorithm: sha256, md5, etc.', default: 'sha256' }
    },
    handler: async () => {
      throw new Error('DESKTOP server connection required. Please ensure the desktop server is running.')
    }
  }
]
