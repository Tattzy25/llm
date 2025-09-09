"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Server, Activity, Wrench, CheckCircle, XCircle, Play, Square, RefreshCw } from 'lucide-react'
import { getMCPManager } from '@/lib/mcp/manager'

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

interface ServerMetrics {
  serverId: string
  status: 'up' | 'down' | 'degraded'
  latency: {
    typical: number
    slowest: number
  }
  successRate: {
    last15min: number
    last24h: number
  }
  toolCount: number
  version: string
  schemaHash: string
  lastChange: string
  lastCheck: string
  recentActivity: Array<{
    timestamp: string
    tool: string
    success: boolean
    duration: number
    userId?: string
  }>
  permissions: {
    readFiles: boolean
    writeFiles: boolean
    network: boolean
    system: boolean
  }
}

interface UserMetrics {
  userId: string
  os: string
  lastHeartbeat: string
  lastSuccessfulCall: string
  lastError: {
    timestamp: string
    error: string
    serverId: string
  } | null
  connectedServers: string[]
  permissionsGranted: {
    readFiles: boolean
    writeFiles: boolean
    network: boolean
    system: boolean
  }
  totalCalls: number
  successRate: number
}

interface HealthMetrics {
  status: 'up' | 'degraded' | 'down'
  responseTime: {
    typical: number
    slowest: number
  }
  lastSuccess: {
    timestamp: string
    reason: string
  }
  lastFailure: {
    timestamp: string
    reason: string
  }
  version: string
  schemaChanged: boolean
  lastSchemaCheck: string
  serverMetrics: ServerMetrics[]
  userMetrics: UserMetrics[]
}

interface ReliabilityMetrics {
  successRate: {
    last15min: number
    last24h: number
  }
  timeouts: {
    count: number
    topCauses: Array<{ cause: string; count: number }>
  }
  crashes: {
    count: number
    topCauses: Array<{ cause: string; count: number }>
  }
  coldStarts: {
    averageTime: number
    count: number
  }
  retries: {
    total: number
    successAfterRetry: number
  }
}

interface UsageMetrics {
  callsPerTool: Record<string, number>
  activeUsers: {
    today: number
    last7days: number
  }
  heavySessions: Array<{
    sessionId: string
    userId: string
    calls: number
    duration: number
  }>
  popularTools: Record<string, number>
}

interface CostRiskMetrics {
  tokenEstimates: Record<string, number>
  costEstimates: Record<string, number>
  dataSensitivity: {
    piiDetected: boolean
    filePaths: boolean
    secrets: boolean
  }
  permissions: {
    readFiles: boolean
    writeFiles: boolean
    systemControl: boolean
    network: boolean
  }
}

interface RoutingMetrics {
  handoffsPerSession: number
  loopsDetected: number
  averageStepsToFinish: number
  sessionStats: Array<{
    sessionId: string
    steps: number
    handoffs: number
    loops: number
  }>
}

interface Alert {
  id: string
  type: 'error_spike' | 'timeout_spike' | 'schema_change' | 'looping' | 'cost_anomaly' | 'slowdown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  serverId?: string
  toolId?: string
}

export function MCPControlPanel() {
  const [serverStatuses, setServerStatuses] = useState<Record<string, ServerStatus>>({})
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string>('')

  // New monitoring state
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null)
  const [reliabilityMetrics, setReliabilityMetrics] = useState<ReliabilityMetrics | null>(null)
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null)
  const [costRiskMetrics, setCostRiskMetrics] = useState<CostRiskMetrics | null>(null)
  const [routingMetrics, setRoutingMetrics] = useState<RoutingMetrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])

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

  const loadHealthMetrics = useCallback(async () => {
    try {
      const result = await manager.getHealthMetrics()
      if (result.success && result.data) {
        setHealthMetrics(result.data as HealthMetrics)
      }
    } catch (error) {
      console.error('Failed to load health metrics:', error)
    }
  }, [manager])

  const loadReliabilityMetrics = useCallback(async () => {
    try {
      const result = await manager.getReliabilityMetrics()
      if (result.success && result.data) {
        setReliabilityMetrics(result.data as ReliabilityMetrics)
      }
    } catch (error) {
      console.error('Failed to load reliability metrics:', error)
    }
  }, [manager])

  const loadUsageMetrics = useCallback(async () => {
    try {
      const result = await manager.getUsageMetrics()
      if (result.success && result.data) {
        setUsageMetrics(result.data as UsageMetrics)
      }
    } catch (error) {
      console.error('Failed to load usage metrics:', error)
    }
  }, [manager])

  const loadCostRiskMetrics = useCallback(async () => {
    try {
      const result = await manager.getCostRiskMetrics()
      if (result.success && result.data) {
        setCostRiskMetrics(result.data as CostRiskMetrics)
      }
    } catch (error) {
      console.error('Failed to load cost/risk metrics:', error)
    }
  }, [manager])

  const loadRoutingMetrics = useCallback(async () => {
    try {
      const result = await manager.getRoutingMetrics()
      if (result.success && result.data) {
        setRoutingMetrics(result.data as RoutingMetrics)
      }
    } catch (error) {
      console.error('Failed to load routing metrics:', error)
    }
  }, [manager])

  const loadAlerts = useCallback(async () => {
    try {
      const result = await manager.getAlerts()
      if (result.success && result.data) {
        setAlerts(result.data as Alert[])
      }
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }, [manager])

  const refreshData = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      loadServerStatuses(),
      loadSystemHealth(),
      loadHealthMetrics(),
      loadReliabilityMetrics(),
      loadUsageMetrics(),
      loadCostRiskMetrics(),
      loadRoutingMetrics(),
      loadAlerts()
    ])
    setLoading(false)
  }, [
    loadServerStatuses,
    loadSystemHealth,
    loadHealthMetrics,
    loadReliabilityMetrics,
    loadUsageMetrics,
    loadCostRiskMetrics,
    loadRoutingMetrics,
    loadAlerts
  ])

  useEffect(() => {
    refreshData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  const handleServerAction = async (serverId: string, action: 'start' | 'stop') => {
    setActionLoading(`${action}-${serverId}`)
    try {
      const result = action === 'start'
        ? await manager.startServer(serverId)
        : await manager.stopServer(serverId)

      setLastAction(result.success
        ? `${action === 'start' ? 'Started' : 'Stopped'} ${serverId} successfully`
        : `Failed to ${action} ${serverId}: ${result.error}`
      )
      await refreshData()
    } catch (error) {
      setLastAction(`Error ${action === 'start' ? 'starting' : 'stopping'} ${serverId}: ${error}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleServerTest = async (serverId: string) => {
    setActionLoading(`test-${serverId}`)
    try {
      const result = await manager.runServerTest(serverId)
      const testData = result.data as { latency?: number; toolsTested?: number; details?: string } | undefined
      setLastAction(result.success
        ? `Test successful for ${serverId}: ${testData?.latency || 'N/A'}ms latency`
        : `Test failed for ${serverId}: ${result.error}`
      )
      await refreshData()
    } catch (error) {
      setLastAction(`Error testing ${serverId}: ${error}`)
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
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="routing">Routing</TabsTrigger>
          <TabsTrigger value="cost-risk">Cost/Risk</TabsTrigger>
          <TabsTrigger value="local-tools">Local Tools</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
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
              <div className="space-y-4">
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

                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Built-in Servers:</strong></p>
                  <p>• Desktop Server: Run <code className="bg-muted px-1 rounded">npm run mcp-desktop</code></p>
                  <p>• Server Manager: Run <code className="bg-muted px-1 rounded">npm run mcp-server-manager</code></p>
                  <p>• File System: Built-in (no server needed)</p>
                </div>
              </div>
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

        <TabsContent value="health" className="space-y-4">
          {healthMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{healthMetrics.status}</div>
                  <p className="text-xs text-muted-foreground">
                    Last checked: {new Date(healthMetrics.lastSchemaCheck).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthMetrics.responseTime.typical}ms</div>
                  <p className="text-xs text-muted-foreground">
                    Slowest: {healthMetrics.responseTime.slowest}ms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Version</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthMetrics.version}</div>
                  <p className="text-xs text-muted-foreground">
                    Schema changed: {healthMetrics.schemaChanged ? 'Yes' : 'No'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Per-Server Tiles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Server Health</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {healthMetrics?.serverMetrics?.map((server) => (
                <Card key={server.serverId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{server.serverId}</CardTitle>
                      <Badge variant={
                        server.status === 'up' ? 'default' :
                        server.status === 'degraded' ? 'secondary' : 'destructive'
                      }>
                        {server.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      v{server.version} • {server.toolCount} tools
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Latency:</span>
                        <div className="font-medium">{server.latency.typical}ms</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success:</span>
                        <div className="font-medium">{(server.successRate.last15min * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Permissions:</span>
                      <div className="flex gap-1 flex-wrap">
                        {server.permissions.readFiles && <Badge variant="outline" className="text-xs">Read</Badge>}
                        {server.permissions.writeFiles && <Badge variant="outline" className="text-xs">Write</Badge>}
                        {server.permissions.network && <Badge variant="outline" className="text-xs">Network</Badge>}
                        {server.permissions.system && <Badge variant="outline" className="text-xs">System</Badge>}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Recent Activity:</span>
                      <div className="space-y-1">
                        {server.recentActivity.slice(0, 3).map((activity, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${activity.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>{activity.tool}</span>
                            <span className="text-muted-foreground">({activity.duration}ms)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleServerTest(server.serverId)}
                      disabled={actionLoading === `test-${server.serverId}`}
                    >
                      {actionLoading === `test-${server.serverId}` ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-3 w-3" />
                      )}
                      Run Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Per-User Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Activity</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {healthMetrics?.userMetrics?.map((user) => (
                <Card key={user.userId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{user.userId}</CardTitle>
                      <Badge variant="outline">{user.os}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.totalCalls} total calls • {(user.successRate * 100).toFixed(0)}% success
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Last Heartbeat:</span>
                        <div className="font-medium">
                          {new Date(user.lastHeartbeat).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Success:</span>
                        <div className="font-medium">
                          {new Date(user.lastSuccessfulCall).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Connected Servers:</span>
                      <div className="flex gap-1 flex-wrap">
                        {user.connectedServers.map(server => (
                          <Badge key={server} variant="secondary" className="text-xs">{server}</Badge>
                        ))}
                      </div>
                    </div>

                    {user.lastError && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm font-medium text-red-800">Last Error</div>
                        <div className="text-xs text-red-600">{user.lastError.error}</div>
                        <div className="text-xs text-red-500">
                          {new Date(user.lastError.timestamp).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Last Events</CardTitle>
              <CardDescription>Recent success and failure events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthMetrics?.lastSuccess && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Success</p>
                    <p className="text-sm text-muted-foreground">{healthMetrics.lastSuccess.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(healthMetrics.lastSuccess.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {healthMetrics?.lastFailure && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Failure</p>
                    <p className="text-sm text-muted-foreground">{healthMetrics.lastFailure.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(healthMetrics.lastFailure.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-4">
          {reliabilityMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Success Rate (15min)</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(reliabilityMetrics.successRate.last15min * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Success Rate (24h)</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(reliabilityMetrics.successRate.last24h * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Timeouts</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reliabilityMetrics.timeouts.count}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Cold Starts</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reliabilityMetrics.coldStarts.averageTime}ms</div>
                  <p className="text-xs text-muted-foreground">
                    {reliabilityMetrics.coldStarts.count} total
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Timeout Causes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reliabilityMetrics?.timeouts.topCauses.map((cause, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{cause.cause}</span>
                      <Badge variant="secondary">{cause.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retry Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Retries</span>
                    <span className="font-medium">{reliabilityMetrics?.retries.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success After Retry</span>
                    <span className="font-medium">{reliabilityMetrics?.retries.successAfterRetry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium">
                      {reliabilityMetrics ? ((reliabilityMetrics.retries.successAfterRetry / reliabilityMetrics.retries.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {usageMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageMetrics.activeUsers.today}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Active Users (7 days)</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageMetrics.activeUsers.last7days}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Tool Calls</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(usageMetrics.callsPerTool).reduce((a, b) => a + b, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Heavy Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageMetrics.heavySessions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Top 10 by activity
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tool Usage</CardTitle>
                <CardDescription>Calls per tool</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {usageMetrics && Object.entries(usageMetrics.callsPerTool)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([tool, calls]) => (
                      <div key={tool} className="flex justify-between">
                        <span className="text-sm">{tool.replace(/_/g, ' ')}</span>
                        <Badge variant="secondary">{calls}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Heavy Sessions</CardTitle>
                <CardDescription>Most active sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {usageMetrics?.heavySessions.map((session, index) => (
                    <div key={session.sessionId} className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">Session {index + 1}</span>
                        <p className="text-xs text-muted-foreground">
                          {session.calls} calls, {Math.round(session.duration / 60)}min
                        </p>
                      </div>
                      <Badge variant="outline">{session.userId}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          {routingMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Handoffs/Session</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{routingMetrics.handoffsPerSession.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Average handoffs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Loops Detected</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{routingMetrics.loopsDetected}</div>
                  <p className="text-xs text-muted-foreground">
                    Total loops
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Avg Steps to Finish</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{routingMetrics.averageStepsToFinish.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Steps per task
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{routingMetrics.sessionStats.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Analyzed sessions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Session Analysis</CardTitle>
              <CardDescription>Detailed routing metrics per session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {routingMetrics?.sessionStats.map((session, index) => (
                  <div key={session.sessionId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">Session {index + 1}</span>
                      <p className="text-sm text-muted-foreground">
                        {session.steps} steps • {session.handoffs} handoffs • {session.loops} loops
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={session.loops > 0 ? "destructive" : "secondary"}>
                        {session.loops > 0 ? "Has Loops" : "Clean"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-risk" className="space-y-4">
          {costRiskMetrics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Data Sensitivity</CardTitle>
                  <CardDescription>Privacy and security flags</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PII Detected</span>
                    <Badge variant={costRiskMetrics.dataSensitivity.piiDetected ? "destructive" : "secondary"}>
                      {costRiskMetrics.dataSensitivity.piiDetected ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">File Paths</span>
                    <Badge variant={costRiskMetrics.dataSensitivity.filePaths ? "destructive" : "secondary"}>
                      {costRiskMetrics.dataSensitivity.filePaths ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Secrets</span>
                    <Badge variant={costRiskMetrics.dataSensitivity.secrets ? "destructive" : "secondary"}>
                      {costRiskMetrics.dataSensitivity.secrets ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Permissions Used</CardTitle>
                  <CardDescription>System access levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Read Files</span>
                    <Badge variant={costRiskMetrics.permissions.readFiles ? "default" : "secondary"}>
                      {costRiskMetrics.permissions.readFiles ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Write Files</span>
                    <Badge variant={costRiskMetrics.permissions.writeFiles ? "destructive" : "secondary"}>
                      {costRiskMetrics.permissions.writeFiles ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Control</span>
                    <Badge variant={costRiskMetrics.permissions.systemControl ? "destructive" : "secondary"}>
                      {costRiskMetrics.permissions.systemControl ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Access</span>
                    <Badge variant={costRiskMetrics.permissions.network ? "default" : "secondary"}>
                      {costRiskMetrics.permissions.network ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Cost Estimates</CardTitle>
              <CardDescription>Token and dollar costs for LLM-backed tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {costRiskMetrics && Object.entries(costRiskMetrics.tokenEstimates).map(([tool, tokens]) => (
                  <div key={tool} className="flex justify-between items-center">
                    <span className="text-sm">{tool.replace(/_/g, ' ')}</span>
                    <div className="text-right">
                      <div className="font-medium">{tokens} tokens</div>
                      <div className="text-xs text-muted-foreground">
                        ~${costRiskMetrics.costEstimates[tool] || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Active Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Real-time monitoring alerts and notifications
              </p>
            </div>
            <Badge variant="secondary">{alerts.length} active</Badge>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'high' ? 'default' :
                          'secondary'
                        }>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{alert.type.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                        {alert.serverId && ` • Server: ${alert.serverId}`}
                        {alert.toolId && ` • Tool: ${alert.toolId}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {alerts.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">All Clear</h3>
                  <p className="text-sm text-muted-foreground">
                    No active alerts at this time
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="local-tools" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">No-API Local MCP Tools</h3>
              <p className="text-sm text-muted-foreground">
                Pre-built MCP servers that run locally without requiring external API keys
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'File System',
                description: 'List, read, write files & folders; search by name/content',
                icon: '📁',
                tools: ['list_dir', 'read_file', 'write_file', 'search_files'],
                status: 'available',
                category: 'filesystem'
              },
              {
                name: 'Terminal/Shell',
                description: 'Run safe whitelisted commands; return stdout/stderr',
                icon: '💻',
                tools: ['run_command', 'get_output'],
                status: 'available',
                category: 'system'
              },
              {
                name: 'Process Manager',
                description: 'List/kill processes, monitor CPU/RAM, start apps',
                icon: '⚙️',
                tools: ['list_processes', 'kill_process', 'start_app', 'get_system_info'],
                status: 'available',
                category: 'system'
              },
              {
                name: 'Clipboard',
                description: 'Read/write clipboard text and images',
                icon: '📋',
                tools: ['read_clipboard', 'write_clipboard', 'get_clipboard_image'],
                status: 'available',
                category: 'desktop'
              },
              {
                name: 'Screenshot & Screen Info',
                description: 'Capture screen/active window, list displays',
                icon: '📸',
                tools: ['take_screenshot', 'get_window_info', 'list_displays'],
                status: 'available',
                category: 'desktop'
              },
              {
                name: 'Window Manager',
                description: 'Focus/move/resize windows, bring app to front',
                icon: '🖼️',
                tools: ['focus_window', 'move_window', 'resize_window', 'list_windows'],
                status: 'available',
                category: 'desktop'
              },
              {
                name: 'Keyboard & Mouse Automator',
                description: 'Simulate keys/clicks for quick macros',
                icon: '⌨️',
                tools: ['type_text', 'press_key', 'click_mouse', 'move_mouse'],
                status: 'available',
                category: 'automation'
              },
              {
                name: 'Local OCR',
                description: 'Extract text from images/PDFs using Tesseract',
                icon: '👁️',
                tools: ['extract_text', 'ocr_image', 'ocr_pdf'],
                status: 'install_required',
                category: 'ai'
              },
              {
                name: 'PDF Tools',
                description: 'Split/merge, extract text/images, count pages',
                icon: '📄',
                tools: ['split_pdf', 'merge_pdf', 'extract_pdf_text', 'count_pages'],
                status: 'available',
                category: 'document'
              },
              {
                name: 'Image Tools',
                description: 'Resize/crop/convert, compress, format swap',
                icon: '🖼️',
                tools: ['resize_image', 'crop_image', 'convert_format', 'compress_image'],
                status: 'available',
                category: 'media'
              },
              {
                name: 'Archive Tools',
                description: 'Zip/unzip/tar; bulk compress/decompress folders',
                icon: '📦',
                tools: ['zip_files', 'unzip_files', 'tar_files', 'compress_folder'],
                status: 'available',
                category: 'utility'
              },
              {
                name: 'Text/Document Converter',
                description: 'Convert between Markdown/HTML/DOCX/TXT',
                icon: '📝',
                tools: ['markdown_to_html', 'html_to_markdown', 'docx_to_txt', 'txt_to_docx'],
                status: 'available',
                category: 'document'
              },
              {
                name: 'Local Search Index',
                description: 'Index folders for fast content search with snippets',
                icon: '🔍',
                tools: ['index_folder', 'search_index', 'get_snippets'],
                status: 'available',
                category: 'search'
              },
              {
                name: 'SQLite/CSV Query',
                description: 'Run read-only queries on local SQLite/CSV files',
                icon: '🗃️',
                tools: ['query_sqlite', 'query_csv', 'export_results'],
                status: 'available',
                category: 'database'
              },
              {
                name: 'Git Local Repo',
                description: 'Status, diff, branch, commit (read-only mode)',
                icon: '📚',
                tools: ['git_status', 'git_diff', 'git_log', 'git_branch'],
                status: 'available',
                category: 'development'
              },
              {
                name: 'HTTP Fetcher',
                description: 'GET/HEAD any URL; save file (no external API key)',
                icon: '🌐',
                tools: ['http_get', 'http_head', 'download_file'],
                status: 'available',
                category: 'network'
              },
              {
                name: 'Network Utils',
                description: 'Ping/trace/port-check; show local IPs/interfaces',
                icon: '📡',
                tools: ['ping_host', 'trace_route', 'check_port', 'get_network_info'],
                status: 'available',
                category: 'network'
              },
              {
                name: 'System Info',
                description: 'Disk space, temps, battery, memory, CPU load',
                icon: '💻',
                tools: ['get_disk_space', 'get_temps', 'get_battery', 'get_memory', 'get_cpu'],
                status: 'available',
                category: 'system'
              },
              {
                name: 'QR/Barcode Generator',
                description: 'Generate QR/Code128 as PNG/SVG; decode images',
                icon: '📱',
                tools: ['generate_qr', 'generate_barcode', 'decode_qr', 'decode_barcode'],
                status: 'available',
                category: 'utility'
              },
              {
                name: 'Audio Recorder (Local)',
                description: 'Record mic to WAV/MP3; basic trim (no cloud)',
                icon: '🎤',
                tools: ['start_recording', 'stop_recording', 'trim_audio', 'convert_audio'],
                status: 'available',
                category: 'media'
              }
            ].map((tool) => (
              <Card key={tool.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{tool.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {tool.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={tool.status === 'available' ? 'default' : 'secondary'}>
                      {tool.status === 'available' ? 'Ready' : 'Install Required'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {tool.description}
                  </CardDescription>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Available Tools:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tool.tools.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="sm"
                      disabled={tool.status !== 'available'}
                    >
                      {tool.status === 'available' ? (
                        <>
                          <Play className="mr-2 h-3 w-3" />
                          Launch Server
                        </>
                      ) : (
                        <>
                          <Wrench className="mr-2 h-3 w-3" />
                          Install Required
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
