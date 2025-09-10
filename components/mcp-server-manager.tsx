"use client"

/**
 * MCP Server Component
 *
 * Provides functionality to start and manage MCP servers.
 * Allows users to configure and launch MCP servers for external connections.
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Square, Settings, Server } from "lucide-react"

interface MCPServerConfig {
  id: string
  name: string
  port: number
  type: 'filesystem' | 'web-search' | 'database' | 'custom'
  status: 'stopped' | 'starting' | 'running' | 'error'
  endpoint?: string
  config: Record<string, unknown>
}

export function MCPServerManager() {
  const [servers, setServers] = React.useState<MCPServerConfig[]>([
    {
      id: 'filesystem-1',
      name: 'File System Server',
      port: 3001,
      type: 'filesystem',
      status: 'stopped',
      config: {
        rootPath: '/tmp',
        allowedExtensions: ['.txt', '.md', '.json']
      }
    },
    {
      id: 'web-search-1',
      name: 'Web Search Server',
      port: 3002,
      type: 'web-search',
      status: 'stopped',
      config: {
        searchEngine: 'google',
        maxResults: 10
      }
    },
    {
      id: 'database-1',
      name: 'Database Server',
      port: 3003,
      type: 'database',
      status: 'stopped',
      config: {
        connectionString: 'postgresql://localhost:5432/mydb',
        maxConnections: 10
      }
    }
  ])

  const [newServer, setNewServer] = React.useState<{
    name: string
    port: number
    type: MCPServerConfig['type']
  }>({
    name: '',
    port: 3004,
    type: 'custom'
  })

  const startServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    setServers(prev => prev.map(s =>
      s.id === serverId
        ? { ...s, status: 'starting' as const }
        : s
    ));

    try {
      // Make actual HTTP request to start the server
      const baseUrl = process.env.NEXT_PUBLIC_MCP_SERVER_MANAGER_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/servers/${serverId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Auth bypassed for now; when enabled, inject a short-lived JWT via server route, not client env
        },
        body: JSON.stringify({
          port: server.port,
          type: server.type,
          config: server.config
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      setServers(prev => prev.map(s =>
        s.id === serverId
          ? {
            ...s,
            status: 'running' as const,
            endpoint: result.endpoint || `ws://localhost:${server.port}`
          }
          : s
      ));
    } catch (error) {
      console.error('Failed to start server:', error);
      setServers(prev => prev.map(s =>
        s.id === serverId
          ? { ...s, status: 'error' as const }
          : s
      ));
    }
  }

  const stopServer = async (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? { ...server, status: 'stopped' as const, endpoint: undefined }
        : server
    ))
  }

  const addServer = () => {
    if (newServer.name.trim()) {
      const server: MCPServerConfig = {
        id: `${newServer.type}-${Date.now()}`,
        name: newServer.name,
        port: newServer.port,
        type: newServer.type,
        status: 'stopped',
        config: {}
      }

      setServers(prev => [...prev, server])
      setNewServer({ name: '', port: 3004, type: 'custom' })
    }
  }

  const getStatusColor = (status: MCPServerConfig['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'starting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: MCPServerConfig['status']) => {
    switch (status) {
      case 'running': return 'Running'
      case 'starting': return 'Starting...'
      case 'error': return 'Error'
      default: return 'Stopped'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MCP Servers</h2>
          <p className="text-muted-foreground">
            Manage MCP servers for external tool connections.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Server className="h-3 w-3" />
          {servers.filter(s => s.status === 'running').length} Running
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Server List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Active Servers
            </CardTitle>
            <CardDescription>
              Start and stop MCP servers to provide external access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} />
                        <h4 className="font-medium">{server.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {server.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Port: {server.port}
                        {server.endpoint && (
                          <span className="ml-2">• {server.endpoint}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {getStatusText(server.status)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {server.status === 'running' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => stopServer(server.id)}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => startServer(server.id)}
                          disabled={server.status === 'starting'}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Add New Server */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Add New Server
            </CardTitle>
            <CardDescription>
              Create a new MCP server configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name</Label>
              <Input
                id="server-name"
                placeholder="My Custom Server"
                value={newServer.name}
                onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-port">Port</Label>
              <Input
                id="server-port"
                type="number"
                placeholder="3004"
                value={newServer.port}
                onChange={(e) => setNewServer(prev => ({ ...prev, port: parseInt(e.target.value) || 3004 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-type">Type</Label>
              <select
                id="server-type"
                title="Server Type"
                className="w-full p-2 border rounded-md"
                value={newServer.type}
                onChange={(e) => setNewServer(prev => ({ ...prev, type: e.target.value as MCPServerConfig['type'] }))}
              >
                <option value="custom">Custom</option>
                <option value="filesystem">File System</option>
                <option value="web-search">Web Search</option>
                <option value="database">Database</option>
              </select>
            </div>
            <Button onClick={addServer} className="w-full" disabled={!newServer.name.trim()}>
              Add Server
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Server Logs/Status */}
      <Card>
        <CardHeader>
          <CardTitle>Server Status</CardTitle>
          <CardDescription>
            Real-time status and logs from MCP servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 font-mono text-sm">
              {servers.map((server) => (
                <div key={server.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                  <span className={`px-2 py-1 rounded text-xs ${server.status === 'running' ? 'bg-green-100 text-green-800' :
                    server.status === 'starting' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {server.name}
                  </span>
                  <span>
                    {server.status === 'running' ? 'Server started successfully' :
                      server.status === 'starting' ? 'Starting server...' :
                        'Server stopped'}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
