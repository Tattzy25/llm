import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'reconnecting'

export interface ServerConnection {
  id: string
  name: string
  url: string
  status: ConnectionStatus
  lastConnected?: Date
  error?: string
  latency?: number
}

interface ConnectionStatusProps {
  connections: ServerConnection[]
  onReconnect?: (serverId: string) => void
  onDisconnect?: (serverId: string) => void
  onConnect?: (serverId: string) => void
  compact?: boolean
}

export function ConnectionStatusComponent({
  connections,
  onReconnect,
  onDisconnect,
  onConnect,
  compact = false
}: ConnectionStatusProps) {
  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'connecting':
      case 'reconnecting':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return 'Reconnecting...'
      case 'error':
        return 'Connection Error'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Unknown'
    }
  }

  if (compact) {
    const connectedCount = connections.filter(c => c.status === 'connected').length
    const totalCount = connections.length

    return (
      <div className="flex items-center gap-2">
        {getStatusIcon(connectedCount === totalCount ? 'connected' : 'disconnected')}
        <span className="text-sm">
          {connectedCount}/{totalCount} servers
        </span>
      </div>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Server Connections</h3>
          <Badge variant="outline">
            {connections.filter(c => c.status === 'connected').length}/{connections.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(connection.status)}
                <div>
                  <div className="text-sm font-medium">{connection.name}</div>
                  <div className="text-xs text-muted-foreground">{connection.url}</div>
                  {connection.latency && (
                    <div className="text-xs text-muted-foreground">
                      {connection.latency}ms latency
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs", getStatusColor(connection.status))}
                >
                  {getStatusText(connection.status)}
                </Badge>

                {connection.status === 'error' && connection.error && (
                  <div className="text-xs text-red-600 max-w-32 truncate" title={connection.error}>
                    {connection.error}
                  </div>
                )}

                <div className="flex gap-1">
                  {connection.status === 'disconnected' && onConnect && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConnect(connection.id)}
                    >
                      <Wifi className="w-3 h-3" />
                    </Button>
                  )}

                  {(connection.status === 'error' || connection.status === 'disconnected') && onReconnect && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReconnect(connection.id)}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}

                  {connection.status === 'connected' && onDisconnect && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDisconnect(connection.id)}
                    >
                      <WifiOff className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {connections.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No servers configured</p>
          </div>
        )}
      </div>
    </Card>
  )
}
