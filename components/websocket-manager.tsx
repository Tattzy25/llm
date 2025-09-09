import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Trash2,
  Send,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type WebSocketState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'

export interface WebSocketConnection {
  id: string
  name: string
  url: string
  state: WebSocketState
  lastConnected?: Date
  lastMessage?: Date
  error?: string
  messageCount: number
  bytesReceived: number
  bytesSent: number
  ping?: number
}

export interface WebSocketMessage {
  id: string
  connectionId: string
  timestamp: Date
  direction: 'sent' | 'received'
  type: 'text' | 'binary'
  size: number
  preview: string
  raw?: string
}

interface WebSocketManagerProps {
  connections: WebSocketConnection[]
  messages: WebSocketMessage[]
  onConnect: (connectionId: string) => void
  onDisconnect: (connectionId: string) => void
  onSendMessage: (connectionId: string, message: string) => void
  onAddConnection: (name: string, url: string) => void
  onRemoveConnection: (connectionId: string) => void
  onClearMessages: (connectionId?: string) => void
}

export function WebSocketManager({
  connections,
  messages,
  onConnect,
  onDisconnect,
  onSendMessage,
  onAddConnection,
  onRemoveConnection,
  onClearMessages
}: WebSocketManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newConnection, setNewConnection] = useState({ name: '', url: '' })
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAddConnection = () => {
    if (newConnection.name && newConnection.url) {
      onAddConnection(newConnection.name, newConnection.url)
      setNewConnection({ name: '', url: '' })
      setIsAddDialogOpen(false)
    }
  }

  const getStateIcon = (state: WebSocketState) => {
    switch (state) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />
    }
  }

  const getStateColor = (state: WebSocketState) => {
    switch (state) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'connecting':
      case 'reconnecting':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0')
  }

  const selectedConnectionData = connections.find(c => c.id === selectedConnection)
  const connectionMessages = messages.filter(m => m.connectionId === selectedConnection)

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Connections Panel */}
      <div className="col-span-4">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                WebSocket Connections
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add WebSocket Connection</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="conn-name">Connection Name</Label>
                      <Input
                        id="conn-name"
                        value={newConnection.name}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My MCP Server"
                      />
                    </div>
                    <div>
                      <Label htmlFor="conn-url">WebSocket URL</Label>
                      <Input
                        id="conn-url"
                        value={newConnection.url}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="ws://localhost:3001"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddConnection}>
                        Add Connection
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedConnection === connection.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedConnection(connection.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStateIcon(connection.state)}
                        <span className="font-medium text-sm">{connection.name}</span>
                      </div>
                      <div className="flex gap-1">
                        {connection.state === 'disconnected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onConnect(connection.id)
                            }}
                          >
                            <Wifi className="w-3 h-3" />
                          </Button>
                        )}
                        {connection.state === 'connected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDisconnect(connection.id)
                            }}
                          >
                            <WifiOff className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveConnection(connection.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{connection.url}</div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getStateColor(connection.state))}
                        >
                          {connection.state}
                        </Badge>
                        {connection.ping && (
                          <span>{connection.ping}ms</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span>{connection.messageCount} msgs</span>
                        <span>{formatBytes(connection.bytesReceived + connection.bytesSent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Messages Panel */}
      <div className="col-span-8">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                {selectedConnectionData ? selectedConnectionData.name : 'Select Connection'}
              </CardTitle>
              {selectedConnection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onClearMessages(selectedConnection)}
                >
                  Clear Messages
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-col h-full">
            {/* Messages Display */}
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-2">
                {selectedConnection ? (
                  connectionMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Connect to start sending/receiving messages</p>
                    </div>
                  ) : (
                    connectionMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "p-3 rounded-lg border text-sm",
                          message.direction === 'sent'
                            ? "bg-blue-50 border-blue-200 ml-8"
                            : "bg-green-50 border-green-200 mr-8"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {message.direction === 'sent' ? (
                              <Upload className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Download className="w-3 h-3 text-green-500" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {message.direction.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {message.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{formatTime(message.timestamp)}</span>
                            <span className="text-xs">({formatBytes(message.size)})</span>
                          </div>
                        </div>
                        <div className="font-mono text-xs bg-background p-2 rounded border overflow-x-auto">
                          {message.preview}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a connection to view messages</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            {selectedConnection && selectedConnectionData?.state === 'connected' && (
              <div className="flex gap-2">
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[60px] max-h-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (messageInput.trim()) {
                        onSendMessage(selectedConnection, messageInput.trim())
                        setMessageInput('')
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (messageInput.trim()) {
                      onSendMessage(selectedConnection, messageInput.trim())
                      setMessageInput('')
                    }
                  }}
                  disabled={!messageInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
