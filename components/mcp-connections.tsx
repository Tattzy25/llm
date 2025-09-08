"use client"

/**
 * MCP Connections Component
 *
 * Provides UI for managing MCP server connections and tool access.
 * Allows users to connect/disconnect from MCP servers and view available tools.
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMCP, PREDEFINED_MCP_SERVERS } from "@/lib/mcp"
import { CheckCircle, XCircle, Loader2, Server, Wrench, Plus } from "lucide-react"

export function MCPConnections() {
  const { servers, isConnecting, connectServer, disconnectServer, getAvailableTools } = useMCP()
  const [connectingServerId, setConnectingServerId] = React.useState<string | null>(null)

  const handleConnect = async (serverConfig: typeof PREDEFINED_MCP_SERVERS[0]) => {
    setConnectingServerId(serverConfig.id)
    try {
      await connectServer(serverConfig)
    } finally {
      setConnectingServerId(null)
    }
  }

  const handleDisconnect = async (serverId: string) => {
    await disconnectServer(serverId)
  }

  const availableTools = getAvailableTools()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MCP Connections</h2>
          <p className="text-muted-foreground">
            Connect to external MCP servers to access additional tools and data sources.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Server className="h-3 w-3" />
          {servers.filter(s => s.connected).length} Connected
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Servers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Available Servers
            </CardTitle>
            <CardDescription>
              Connect to predefined MCP servers to extend functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {PREDEFINED_MCP_SERVERS.map((serverConfig) => {
                  const existingServer = servers.find(s => s.id === serverConfig.id)
                  const isConnected = existingServer?.connected || false
                  const isLoading = connectingServerId === serverConfig.id

                  return (
                    <div
                      key={serverConfig.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{serverConfig.name}</h4>
                          {isConnected ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {serverConfig.endpoint}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {serverConfig.tools.map((tool) => (
                            <Badge key={tool.name} variant="outline" className="text-xs">
                              {tool.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant={isConnected ? "destructive" : "default"}
                        size="sm"
                        onClick={() =>
                          isConnected
                            ? handleDisconnect(serverConfig.id)
                            : handleConnect(serverConfig)
                        }
                        disabled={isLoading || isConnecting}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isConnected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Connected Servers & Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Available Tools
            </CardTitle>
            <CardDescription>
              Tools available from connected MCP servers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {availableTools.length > 0 ? (
                <div className="space-y-4">
                  {availableTools.map((tool, index) => (
                    <div key={`${tool.name}-${index}`} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{tool.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {tool.description}
                          </p>
                          {Object.keys(tool.parameters).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Parameters:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(tool.parameters).map(([param, config]) => (
                                  <Badge
                                    key={param}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {param}: {config.type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-muted-foreground">No Tools Available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect to MCP servers to access additional tools.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      {servers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Current status of all MCP server connections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {servers.map((server) => (
                <div key={server.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {server.connected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{server.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {server.endpoint}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={server.connected ? "default" : "secondary"}>
                      {server.connected ? "Connected" : "Disconnected"}
                    </Badge>
                    {server.lastConnected && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last connected: {server.lastConnected.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
