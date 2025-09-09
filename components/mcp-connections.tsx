"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Search,
  Wrench,
  Play,
  Globe,
  Database,
  Bot,
  Settings,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { getMCPManager } from '@/lib/mcp/manager'
import { ALL_MCP_TOOLS } from '@/lib/mcp/tools'
import { MCPExecutionResult, MCPTool, ToolParameter } from '@/lib/mcp/types'

interface ToolExecutionDialogProps {
  tool: MCPTool | null
  isOpen: boolean
  onClose: () => void
}

function ToolExecutionDialog({ tool, isOpen, onClose }: ToolExecutionDialogProps) {
  const [parameters, setParameters] = useState<Record<string, unknown>>({})
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<MCPExecutionResult | null>(null)

  const handleExecute = async () => {
    if (!tool) return

    setExecuting(true)
    try {
      const manager = getMCPManager()
      const executionResult = await manager.executeTool(tool.name, parameters)
      setResult(executionResult)
    } catch (error) {
      setResult({
        success: false,
        error: String(error),
        executionTime: Date.now()
      } as MCPExecutionResult)
    } finally {
      setExecuting(false)
    }
  }

  const handleParameterChange = (paramName: string, value: unknown) => {
    setParameters(prev => ({ ...prev, [paramName]: value }))
  }

  const getParameterInput = (paramName: string, paramConfig: { type: string; description: string; required?: boolean; default?: unknown }) => {
    const value = parameters[paramName] || paramConfig.default || ''

    switch (paramConfig.type) {
      case 'string':
        return (
          <Input
            type="text"
            value={String(value)}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={paramConfig.description}
            required={paramConfig.required}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => handleParameterChange(paramName, Number(e.target.value))}
            placeholder={paramConfig.description}
            required={paramConfig.required}
          />
        )
      case 'boolean':
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleParameterChange(paramName, val === 'true')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )
      case 'object':
        return (
          <Textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            onChange={(e) => {
              try {
                handleParameterChange(paramName, JSON.parse(e.target.value))
              } catch {
                handleParameterChange(paramName, e.target.value)
              }
            }}
            placeholder={`${paramConfig.description} (JSON format)`}
            rows={4}
          />
        )
      default:
        return (
          <Input
            type="text"
            value={String(value)}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={paramConfig.description}
            required={paramConfig.required}
          />
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Execute {tool?.name}</DialogTitle>
          <DialogDescription>{tool?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {tool?.parameters && Object.entries(tool.parameters).map(([paramName, paramConfig]: [string, ToolParameter]) => (
            <div key={paramName} className="space-y-2">
              <Label htmlFor={paramName}>
                {paramName}
                {paramConfig.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {getParameterInput(paramName, paramConfig)}
              <p className="text-sm text-muted-foreground">{paramConfig.description}</p>
            </div>
          ))}

          {result && (
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? 'Success' : 'Error'}
                </span>
              </div>
              <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-40">
                {result.success
                  ? JSON.stringify(result.data, null, 2)
                  : result.error
                }
              </pre>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleExecute} disabled={executing} className="flex-1">
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Execute Tool
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MCPConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredTools = ALL_MCP_TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'web-scraping': return <Globe className="h-5 w-5" />
      case 'database': return <Database className="h-5 w-5" />
      case 'ai': return <Bot className="h-5 w-5" />
      case 'management': return <Settings className="h-5 w-5" />
      case 'desktop': return <Wrench className="h-5 w-5" />
      case 'filesystem': return <Search className="h-5 w-5" />
      default: return <Wrench className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'web-scraping': return 'bg-blue-500'
      case 'database': return 'bg-green-500'
      case 'ai': return 'bg-purple-500'
      case 'management': return 'bg-orange-500'
      case 'desktop': return 'bg-cyan-500'
      case 'filesystem': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  const handleToolExecute = (tool: MCPTool) => {
    setSelectedTool(tool)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MCP Tools</h2>
          <p className="text-muted-foreground">
            Discover and execute Model Context Protocol tools
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="web-scraping">Web Scraping</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="ai">AI Assistant</SelectItem>
            <SelectItem value="management">Management</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="filesystem">File System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tool Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card key={tool.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(tool.category || 'default')}`}>
                    {getCategoryIcon(tool.category || 'default')}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {tool.category || 'general'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {tool.description}
              </CardDescription>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <strong>Server:</strong> {tool.serverId}
                </div>

                {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Parameters:</strong> {Object.keys(tool.parameters).length} required
                  </div>
                )}

                <Button
                  onClick={() => handleToolExecute(tool)}
                  className="w-full"
                  size="sm"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Execute Tool
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tools found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or category filter
          </p>
        </div>
      )}

      {/* Execution Dialog */}
      {selectedTool && (
        <ToolExecutionDialog
          tool={selectedTool}
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false)
            setSelectedTool(null)
          }}
        />
      )}
    </div>
  )
}
