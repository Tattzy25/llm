import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Play,
  Square,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AutoConnectConfig {
  id: string
  name: string
  serverUrl: string
  autoConnect: boolean
  reconnectInterval: number // seconds
  maxRetries: number
  timeout: number // seconds
  enabled: boolean
}

export interface ConnectionAttempt {
  id: string
  serverId: string
  timestamp: Date
  status: 'success' | 'failed' | 'timeout'
  duration: number
  error?: string
}

interface AutoConnectManagerProps {
  configs: AutoConnectConfig[]
  onConfigUpdate: (config: AutoConnectConfig) => void
  onConfigDelete: (configId: string) => void
  onConfigAdd: (config: Omit<AutoConnectConfig, 'id'>) => void
  connectionHistory: ConnectionAttempt[]
  isAutoConnectEnabled: boolean
  onToggleAutoConnect: (enabled: boolean) => void
  onManualConnect: (serverId: string) => void
  onManualDisconnect: (serverId: string) => void
}

export function AutoConnectManager({
  configs,
  onConfigUpdate,
  onConfigDelete,
  onConfigAdd,
  connectionHistory,
  isAutoConnectEnabled,
  onToggleAutoConnect,
  onManualConnect,
  onManualDisconnect
}: AutoConnectManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AutoConnectConfig | null>(null)
  const [newConfig, setNewConfig] = useState({
    name: '',
    serverUrl: '',
    autoConnect: true,
    reconnectInterval: 30,
    maxRetries: 3,
    timeout: 10,
    enabled: true
  })

  const handleAddConfig = () => {
    if (newConfig.name && newConfig.serverUrl) {
      onConfigAdd(newConfig)
      setNewConfig({
        name: '',
        serverUrl: '',
        autoConnect: true,
        reconnectInterval: 30,
        maxRetries: 3,
        timeout: 10,
        enabled: true
      })
      setIsAddDialogOpen(false)
    }
  }

  const handleUpdateConfig = (config: AutoConnectConfig) => {
    onConfigUpdate(config)
    setEditingConfig(null)
  }

  const getConnectionStatus = (configId: string) => {
    const recentAttempts = connectionHistory
      .filter(attempt => attempt.serverId === configId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (recentAttempts.length === 0) return 'unknown'

    const latest = recentAttempts[0]
    if (latest.status === 'success') return 'connected'
    if (latest.status === 'failed') return 'failed'
    return 'connecting'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'connecting':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Auto-Connect Manager
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-connect"
                checked={isAutoConnectEnabled}
                onCheckedChange={onToggleAutoConnect}
              />
              <Label htmlFor="auto-connect">Auto-connect enabled</Label>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Server
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Server Configuration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Server Name</Label>
                    <Input
                      id="name"
                      value={newConfig.name}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My MCP Server"
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">Server URL</Label>
                    <Input
                      id="url"
                      value={newConfig.serverUrl}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                      placeholder="ws://localhost:3001"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reconnect-interval">Reconnect Interval (s)</Label>
                      <Input
                        id="reconnect-interval"
                        type="number"
                        value={newConfig.reconnectInterval}
                        onChange={(e) => setNewConfig(prev => ({
                          ...prev,
                          reconnectInterval: parseInt(e.target.value) || 30
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-retries">Max Retries</Label>
                      <Input
                        id="max-retries"
                        type="number"
                        value={newConfig.maxRetries}
                        onChange={(e) => setNewConfig(prev => ({
                          ...prev,
                          maxRetries: parseInt(e.target.value) || 3
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="timeout">Timeout (s)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={newConfig.timeout}
                      onChange={(e) => setNewConfig(prev => ({
                        ...prev,
                        timeout: parseInt(e.target.value) || 10
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-connect-new"
                      checked={newConfig.autoConnect}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, autoConnect: checked }))}
                    />
                    <Label htmlFor="auto-connect-new">Auto-connect on startup</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddConfig}>
                      Add Server
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {configs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <WifiOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No servers configured</h3>
              <p className="text-sm">Add your first MCP server to get started with auto-connect.</p>
            </div>
          ) : (
            configs.map((config) => {
              const status = getConnectionStatus(config.id)
              return (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <div className="font-medium">{config.name}</div>
                      <div className="text-sm text-muted-foreground">{config.serverUrl}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getStatusColor(status))}
                        >
                          {status}
                        </Badge>
                        {config.autoConnect && (
                          <Badge variant="secondary" className="text-xs">
                            Auto-connect
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onManualConnect(config.id)}
                      disabled={status === 'connected'}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onManualDisconnect(config.id)}
                      disabled={status !== 'connected'}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingConfig(config)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConfigDelete(config.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Connection History */}
        {connectionHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Recent Connection Attempts</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {connectionHistory.slice(0, 10).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(attempt.status)}
                    <span>{configs.find(c => c.id === attempt.serverId)?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{attempt.timestamp.toLocaleTimeString()}</span>
                    <span>({attempt.duration}ms)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Config Dialog */}
      {editingConfig && (
        <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Server Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Server Name</Label>
                <Input
                  id="edit-name"
                  value={editingConfig.name}
                  onChange={(e) => setEditingConfig(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-url">Server URL</Label>
                <Input
                  id="edit-url"
                  value={editingConfig.serverUrl}
                  onChange={(e) => setEditingConfig(prev => prev ? { ...prev, serverUrl: e.target.value } : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-interval">Reconnect Interval (s)</Label>
                  <Input
                    id="edit-interval"
                    type="number"
                    value={editingConfig.reconnectInterval}
                    onChange={(e) => setEditingConfig(prev => prev ? {
                      ...prev,
                      reconnectInterval: parseInt(e.target.value) || 30
                    } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-retries">Max Retries</Label>
                  <Input
                    id="edit-retries"
                    type="number"
                    value={editingConfig.maxRetries}
                    onChange={(e) => setEditingConfig(prev => prev ? {
                      ...prev,
                      maxRetries: parseInt(e.target.value) || 3
                    } : null)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-auto-connect"
                  checked={editingConfig.autoConnect}
                  onCheckedChange={(checked) => setEditingConfig(prev => prev ? { ...prev, autoConnect: checked } : null)}
                />
                <Label htmlFor="edit-auto-connect">Auto-connect on startup</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingConfig(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateConfig(editingConfig)}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
