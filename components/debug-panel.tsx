import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Bug,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
  Info,
  XCircle,
  Zap,
  Network,
  Database,
  Cpu
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DebugLog {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: string
  metadata?: Record<string, string | number | boolean>
}

export interface DebugMetrics {
  responseTime: number
  tokenCount: number
  modelUsed: string
  serverLatency: number
  memoryUsage: number
  cpuUsage: number
}

interface DebugPanelProps {
  logs: DebugLog[]
  metrics?: DebugMetrics
  isVisible: boolean
  onToggle: () => void
  onClearLogs: () => void
  maxLogs?: number
}

export function DebugPanel({
  logs,
  metrics,
  isVisible,
  onToggle,
  onClearLogs,
  maxLogs = 100
}: DebugPanelProps) {
  const [selectedTab, setSelectedTab] = useState('logs')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const recentLogs = logs.slice(-maxLogs)

  return (
    <Collapsible open={isVisible} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debug Panel
            <Badge variant="secondary">{recentLogs.length}</Badge>
          </div>
          {isVisible ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Debug Information</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClearLogs}>
                Clear Logs
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="logs" className="mt-4">
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-2">
                    {recentLogs.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No debug logs available</p>
                      </div>
                    ) : (
                      recentLogs.map((log) => (
                        <div
                          key={log.id}
                          className={cn(
                            "p-3 rounded-lg border text-sm",
                            getLogColor(log.level)
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {getLogIcon(log.level)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {log.level.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {log.timestamp.toLocaleTimeString()}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {log.source}
                                </Badge>
                              </div>

                              <div className="whitespace-pre-wrap break-words">
                                {log.message}
                              </div>

                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 h-auto p-1 text-xs"
                                      onClick={() => toggleLogExpansion(log.id)}
                                    >
                                      {expandedLogs.has(log.id) ? 'Hide' : 'Show'} metadata
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="metrics" className="mt-4">
                {metrics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium">Response Time</div>
                          <div className="text-lg font-bold">{metrics.responseTime}ms</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <div>
                          <div className="text-sm font-medium">Tokens Used</div>
                          <div className="text-lg font-bold">{metrics.tokenCount.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="text-sm font-medium">Server Latency</div>
                          <div className="text-lg font-bold">{metrics.serverLatency}ms</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-purple-500" />
                        <div>
                          <div className="text-sm font-medium">Memory Usage</div>
                          <div className="text-lg font-bold">{metrics.memoryUsage}%</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-red-500" />
                        <div>
                          <div className="text-sm font-medium">CPU Usage</div>
                          <div className="text-lg font-bold">{metrics.cpuUsage}%</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">Model</div>
                          <div className="text-sm font-bold">{metrics.modelUsed}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No metrics available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
