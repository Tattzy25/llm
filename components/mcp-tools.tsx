"use client"

/**
 * MCP Tools Component
 *
 * Displays and manages tools available from connected MCP servers.
 * Allows users to view tool capabilities, execute tools, and monitor usage.
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMCP } from "@/lib/mcp"
import { Wrench, Play, Activity, Zap, Database, FileText, Search } from "lucide-react"
interface ParameterConfig {
  type: string
  description?: string
  required?: boolean
  default?: unknown
}

interface ToolExecution {
  id: string
  toolName: string
  serverId: string
  parameters: Record<string, unknown>
  result?: unknown
  error?: string
  timestamp: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export function MCPTools() {
  const { servers, getAvailableTools, executeTool } = useMCP()
  const [executions, setExecutions] = React.useState<ToolExecution[]>([])
  const [selectedTool, setSelectedTool] = React.useState<string | null>(null)
  const [toolParams, setToolParams] = React.useState<Record<string, unknown>>({})

  const availableTools = getAvailableTools()

  const getToolIcon = (toolName: string) => {
    if (toolName.includes('file') || toolName.includes('read')) return FileText
    if (toolName.includes('search') || toolName.includes('web')) return Search
    if (toolName.includes('database') || toolName.includes('query')) return Database
    return Wrench
  }

  const getToolCategory = (toolName: string) => {
    if (toolName.includes('file') || toolName.includes('read')) return 'File System'
    if (toolName.includes('search') || toolName.includes('web')) return 'Web & Search'
    if (toolName.includes('database') || toolName.includes('query')) return 'Database'
    if (toolName.includes('system') || toolName.includes('info')) return 'System'
    return 'General'
  }

  const handleExecuteTool = async (toolName: string) => {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const execution: ToolExecution = {
      id: executionId,
      toolName,
      serverId: servers.find(s => s.connected && s.tools.some(t => t.name === toolName))?.id || '',
      parameters: { ...toolParams },
      timestamp: new Date(),
      status: 'running'
    }

    setExecutions(prev => [execution, ...prev])

    try {
      const result = await executeTool(toolName, toolParams)
      setExecutions(prev => prev.map(exec =>
        exec.id === executionId
          ? { ...exec, result, status: 'completed' }
          : exec
      ))
    } catch (error) {
      setExecutions(prev => prev.map(exec =>
        exec.id === executionId
          ? { ...exec, error: error instanceof Error ? error.message : String(error), status: 'failed' }
          : exec
      ))
    }
  }

  const handleParameterChange = (paramName: string, value: unknown) => {
    setToolParams(prev => ({ ...prev, [paramName]: value }))
  }

  const groupedTools = availableTools.reduce((acc, tool) => {
    const category = getToolCategory(tool.name)
    if (!acc[category]) acc[category] = []
    acc[category].push(tool)
    return acc
  }, {} as Record<string, typeof availableTools>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MCP Tools</h2>
          <p className="text-muted-foreground">
            Execute tools from connected MCP servers.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {availableTools.length} Tools Available
        </Badge>
      </div>

      <Tabs defaultValue="tools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tools">Available Tools</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-6">
          {Object.keys(groupedTools).length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tools List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Tool Library
                  </CardTitle>
                  <CardDescription>
                    Browse and execute available tools from connected servers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {Object.entries(groupedTools).map(([category, tools]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            {category}
                          </h4>
                          {tools.map((tool, index) => {
                            const IconComponent = getToolIcon(tool.name)
                            return (
                              <div
                                key={`${tool.name}-${index}`}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  selectedTool === tool.name ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                                }`}
                                onClick={() => setSelectedTool(tool.name)}
                              >
                                <div className="flex items-start gap-3">
                                  <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                  <div className="flex-1">
                                    <h4 className="font-medium">{tool.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {tool.description}
                                    </p>
                                    <div className="flex gap-1 mt-2">
                                      {Object.keys(tool.parameters.properties || {}).map((param) => (
                                        <Badge key={param} variant="outline" className="text-xs">
                                          {param}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Tool Execution Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Execute Tool
                  </CardTitle>
                  <CardDescription>
                    Configure and run the selected tool.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTool ? (
                    <div className="space-y-4">
                      {(() => {
                        const tool = availableTools.find(t => t.name === selectedTool)
                        if (!tool) return null

                        return (
                          <>
                            <div>
                              <h4 className="font-medium">{tool.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {tool.description}
                              </p>
                            </div>

                            {/* Parameters */}
                            <div className="space-y-3">
                              <h5 className="text-sm font-medium">Parameters</h5>
                              {Object.entries(tool.parameters.properties || {}).map(([paramName, paramConfig]) => {
                                // Type guard to check if paramConfig is a ParameterConfig object
                                if (typeof paramConfig === 'object' && paramConfig !== null && 'type' in paramConfig) {
                                  const config = paramConfig as ParameterConfig
                                  return (
                                    <div key={paramName} className="space-y-1">
                                      <Label htmlFor={paramName} className="text-sm">
                                        {paramName}
                                        {config.required && <span className="text-red-500 ml-1">*</span>}
                                      </Label>
                                      <Input
                                        id={paramName}
                                        placeholder={config.description || `Enter ${paramName}`}
                                        value={String(toolParams[paramName] || '')}
                                        onChange={(e) => handleParameterChange(paramName, e.target.value)}
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Type: {config.type}
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              })}
                            </div>

                            <Button
                              onClick={() => handleExecuteTool(selectedTool)}
                              className="w-full"
                              disabled={executions.some(e => e.toolName === selectedTool && e.status === 'running')}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Execute Tool
                            </Button>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                      <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium text-muted-foreground">No Tool Selected</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select a tool from the library to configure and execute it.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground">No Tools Available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect to MCP servers to access tools.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Execution History
              </CardTitle>
              <CardDescription>
                View results and status of tool executions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {executions.length > 0 ? (
                  <div className="space-y-4">
                    {executions.map((execution) => (
                      <div key={execution.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{execution.toolName}</h4>
                              <Badge
                                variant={
                                  execution.status === 'completed' ? 'default' :
                                  execution.status === 'failed' ? 'destructive' :
                                  execution.status === 'running' ? 'secondary' : 'outline'
                                }
                              >
                                {execution.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {execution.timestamp.toLocaleString()}
                            </p>
                            {execution.parameters && Object.keys(execution.parameters).length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground">Parameters:</p>
                                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(execution.parameters, null, 2)}
                                </pre>
                              </div>
                            )}
                            {execution.result !== undefined && execution.result !== null && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground">Result:</p>
                                <pre className="text-xs bg-green-50 dark:bg-green-950 p-2 rounded mt-1 overflow-x-auto">
                                  {typeof execution.result === 'string'
                                    ? execution.result
                                    : JSON.stringify(execution.result, null, 2)}
                                </pre>
                              </div>
                            )}
                            {execution.error && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground">Error:</p>
                                <pre className="text-xs bg-red-50 dark:bg-red-950 p-2 rounded mt-1 overflow-x-auto">
                                  {execution.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-muted-foreground">No Executions</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tool execution history will appear here.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
