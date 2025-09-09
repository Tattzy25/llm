/**
 * File System Tools
 *
 * Built-in file system operations using Node.js fs module.
 * This file should only be imported on the server side.
 */

import type { MCPTool } from '../types'

// File System Tools - Built-in functionality
export const FILE_SYSTEM_TOOLS: MCPTool[] = [
  {
    name: 'search_files',
    description: 'Search for files by name or content',
    category: 'filesystem',
    serverId: 'FILESYSTEM',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      path: { type: 'string', description: 'Directory to search in', default: '.' },
      type: { type: 'string', description: 'Search type: name or content', default: 'name' }
    },
    handler: async (params: Record<string, unknown>) => {
      // Built-in file search - no external server needed
      const fs = await import('fs')
      const pathModule = await import('path')

      const searchFiles = async (dir: string, query: string, searchType: string): Promise<string[]> => {
        const results: string[] = []

        try {
          const items = await fs.promises.readdir(dir)

          for (const item of items) {
            const fullPath = pathModule.join(dir, item)
            const stat = await fs.promises.stat(fullPath)

            if (stat.isDirectory() && !item.startsWith('.')) {
              results.push(...await searchFiles(fullPath, query, searchType))
            } else if (stat.isFile()) {
              if (searchType === 'name' && item.toLowerCase().includes(query.toLowerCase())) {
                results.push(fullPath)
              } else if (searchType === 'content') {
                try {
                  const content = await fs.promises.readFile(fullPath, 'utf8')
                  if (content.toLowerCase().includes(query.toLowerCase())) {
                    results.push(fullPath)
                  }
                } catch {
                  // Skip binary files or files that can't be read
                }
              }
            }
          }
        } catch {
          // Skip directories we can't read
        }

        return results
      }

      const results = await searchFiles((params.path as string) || '.', params.query as string, (params.type as string) || 'name')
      return JSON.stringify(results.slice(0, 100), null, 2) // Limit to 100 results
    }
  }
]
