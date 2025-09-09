"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Server, Activity, Wrench, CheckCircle, XCircle, Play, Square, RefreshCw } from 'lucide-react'
import { getMCPManager } from '@/lib/mcp/manager'
import { MCPExecutionResult } from '@/lib/mcp/types'

interface ServerStatus {
  serverId: string
  active: boolean
  config: {
    httpUrl: string
    endpoint: string
  } | null
}

interface SystemHealth {
  totalServers: number
  activeServers: number
  totalTools: number
  uptime: number
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
  servers: Record<string, {
    active: boolean
    healthy: boolean
    tools: number
  }>
}

export function MCPControlPanel() {
  const [serverStatuses, setServerStatuses] = useState<Record<string, ServerStatus>>({})
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string>('')

  const manager = getMCPManager()

  const loadServerStatuses = useCallback(async () => {
    try {
      const result = await manager.getServerStatus()
      if (result.success && result.data) {
        setServerStatuses(result.data as Record<string, ServerStatus>)
      }
    } catch (error) {
      console.error('Failed to load server statuses:', error)
    }
  }, [manager])

  const loadSystemHealth = useCallback(async () => {
    try {
      const result = await manager.getSystemHealth()
      if (result.success && result.data) {
        setSystemHealth(result.data as SystemHealth)
      }
    } catch (error) {
      console.error('Failed to load system health:', error)
    }
  }, [manager])

  const refreshData = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadServerStatuses(), loadSystemHealth()])
    setLoading(false)
  }, [loadServerStatuses, loadSystemHealth])

  useEffect(() => {
    refreshData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  const handleServerAction = async (serverId: string, action: 'start' | 'stop') => {
    setActionLoading(`${action}-${serverId}`)
    try {
      let result: MCPExecutionResult
      if (action === 'start') {
        result = await manager.startServer(serverId)
      } else {
        result = await manager.stopServer(serverId)
      }

      setLastAction(result.success
        ? `Successfully ${action}ed server ${serverId}`
        : `Failed to ${action} server ${serverId}: ${result.error}`
      )

      await refreshData()
    } catch (error) {
      setLastAction(`Error ${action}ing server ${serverId}: ${error}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartAllServers = async () => {
    setActionLoading('start-all')
    try {
      const results = await manager.startAllServers()
      const successCount = results.filter(r => r.success).length
      setLastAction(`Started ${successCount}/${results.length} servers successfully`)
      await refreshData()
    } catch (error) {
      setLastAction(`Failed to start servers: ${error}`)
    } finally {
      setActionLoading(null)
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MCP Control Panel</h2>
          <p className="text-muted-foreground">
            Manage Model Context Protocol servers and monitor system health
          </p>
        </div>
        <Button onClick={refreshData} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {lastAction && (
        <Alert>
          <AlertDescription>{lastAction}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {systemHealth && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemHealth.totalServers}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemHealth.activeServers} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Tools</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemHealth.totalTools}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all servers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUptime(systemHealth.uptime)}</div>
                  <p className="text-xs text-muted-foreground">
                    Since last restart
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatMemory(systemHealth.memory.heapUsed)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Heap memory
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common MCP management operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleStartAllServers}
                disabled={actionLoading === 'start-all'}
                className="w-full"
              >
                {actionLoading === 'start-all' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start All Servers
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servers" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(serverStatuses).map(([serverId, status]) => (
              <Card key={serverId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{serverId.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</CardTitle>
                    <Badge variant={status.active ? 'default' : 'secondary'}>
                      {status.active ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                  {status.config && (
                    <CardDescription>
                      {status.config.httpUrl}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleServerAction(serverId, 'start')}
                      disabled={actionLoading === `start-${serverId}` || status.active}
                    >
                      {actionLoading === `start-${serverId}` ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-3 w-3" />
                      )}
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleServerAction(serverId, 'stop')}
                      disabled={actionLoading === `stop-${serverId}` || !status.active}
                    >
                      {actionLoading === `stop-${serverId}` ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Square className="mr-2 h-3 w-3" />
                      )}
                      Stop
                    </Button>
                  </div>
                  {systemHealth?.servers[serverId] && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      Tools: {systemHealth.servers[serverId].tools} |
                      Healthy: {systemHealth.servers[serverId].healthy ? 'Yes' : 'No'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Tools</CardTitle>
              <CardDescription>
                Tools organized by server and category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Tool management interface - displays available MCP tools and their status.
                Real-time tool execution and monitoring capabilities.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
