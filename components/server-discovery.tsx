import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  Globe,
  Server,
  Users,
  Star,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  Database,
  Network
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MCPServer {
  id: string
  name: string
  description: string
  url: string
  websocketUrl?: string
  version: string
  author: string
  tags: string[]
  capabilities: string[]
  status: 'online' | 'offline' | 'maintenance'
  lastSeen: Date
  uptime: number // percentage
  responseTime: number // ms
  userCount: number
  rating: number
  verified: boolean
  featured: boolean
  category: 'general' | 'specialized' | 'experimental'
}

export interface ServerDiscoveryProps {
  servers: MCPServer[]
  onConnect: (serverId: string) => void
  onRegister: (server: Omit<MCPServer, 'id' | 'status' | 'lastSeen' | 'uptime' | 'responseTime' | 'userCount' | 'rating'>) => void
  onRefresh: () => void
  isLoading?: boolean
}

export function ServerDiscovery({
  servers,
  onConnect,
  onRegister,
  onRefresh,
  isLoading = false
}: ServerDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [newServer, setNewServer] = useState({
    name: '',
    description: '',
    url: '',
    websocketUrl: '',
    version: '1.0.0',
    author: '',
    tags: '',
    capabilities: '',
    category: 'general' as MCPServer['category']
  })

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || server.category === selectedCategory

    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.every(tag => server.tags.includes(tag))

    return matchesSearch && matchesCategory && matchesTags
  })

  const allTags = Array.from(new Set(servers.flatMap(server => server.tags)))

  const handleRegister = () => {
    if (newServer.name && newServer.url && newServer.author) {
      onRegister({
        ...newServer,
        tags: newServer.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        capabilities: newServer.capabilities.split(',').map(cap => cap.trim()).filter(Boolean),
        verified: false,
        featured: false
      })
      setNewServer({
        name: '',
        description: '',
        url: '',
        websocketUrl: '',
        version: '1.0.0',
        author: '',
        tags: '',
        capabilities: '',
        category: 'general'
      })
      setIsRegisterDialogOpen(false)
    }
  }

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'offline':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'maintenance':
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getCategoryIcon = (category: MCPServer['category']) => {
    switch (category) {
      case 'general':
        return <Server className="w-4 h-4" />
      case 'specialized':
        return <Zap className="w-4 h-4" />
      case 'experimental':
        return <Database className="w-4 h-4" />
    }
  }

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(1)}%`
  }

  const formatResponseTime = (time: number) => {
    return `${time}ms`
  }

  const featuredServers = servers.filter(server => server.featured)
  const verifiedServers = servers.filter(server => server.verified)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            MCP Server Discovery
          </h2>
          <p className="text-muted-foreground">
            Discover and connect to MCP servers in the ecosystem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Register Server
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New MCP Server</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="server-name">Server Name</Label>
                  <Input
                    id="server-name"
                    value={newServer.name}
                    onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My MCP Server"
                  />
                </div>
                <div>
                  <Label htmlFor="server-author">Author</Label>
                  <Input
                    id="server-author"
                    value={newServer.author}
                    onChange={(e) => setNewServer(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <Label htmlFor="server-url">API URL</Label>
                  <Input
                    id="server-url"
                    value={newServer.url}
                    onChange={(e) => setNewServer(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://api.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="server-ws-url">WebSocket URL (Optional)</Label>
                  <Input
                    id="server-ws-url"
                    value={newServer.websocketUrl}
                    onChange={(e) => setNewServer(prev => ({ ...prev, websocketUrl: e.target.value }))}
                    placeholder="wss://ws.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="server-version">Version</Label>
                  <Input
                    id="server-version"
                    value={newServer.version}
                    onChange={(e) => setNewServer(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="server-category">Category</Label>
                  <select
                    id="server-category"
                    title="Select server category"
                    value={newServer.category}
                    onChange={(e) => setNewServer(prev => ({ ...prev, category: e.target.value as MCPServer['category'] }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="general">General</option>
                    <option value="specialized">Specialized</option>
                    <option value="experimental">Experimental</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="server-description">Description</Label>
                  <Textarea
                    id="server-description"
                    value={newServer.description}
                    onChange={(e) => setNewServer(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what your server does..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="server-tags">Tags (comma-separated)</Label>
                  <Input
                    id="server-tags"
                    value={newServer.tags}
                    onChange={(e) => setNewServer(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="ai, chat, tools"
                  />
                </div>
                <div>
                  <Label htmlFor="server-capabilities">Capabilities (comma-separated)</Label>
                  <Input
                    id="server-capabilities"
                    value={newServer.capabilities}
                    onChange={(e) => setNewServer(prev => ({ ...prev, capabilities: e.target.value }))}
                    placeholder="text-generation, image-generation"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRegister}>
                  Register Server
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Servers</p>
                <p className="text-2xl font-bold">{servers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold">{servers.filter(s => s.status === 'online').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{verifiedServers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{servers.reduce((sum, s) => sum + s.userCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search servers, tags, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                title="Filter by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="specialized">Specialized</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Filter by tags:</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Server List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Servers ({filteredServers.length})</TabsTrigger>
          <TabsTrigger value="featured">Featured ({featuredServers.length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedServers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map(server => (
              <Card key={server.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(server.category)}
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      {server.verified && <Shield className="w-4 h-4 text-purple-500" />}
                      {server.featured && <Star className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusColor(server.status))}
                    >
                      {getStatusIcon(server.status)}
                      <span className="ml-1">{server.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{server.description}</p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Author:</span>
                    <span>{server.author}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version:</span>
                    <span>{server.version}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span>{formatUptime(server.uptime)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response:</span>
                    <span>{formatResponseTime(server.responseTime)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Users:</span>
                    <span>{server.userCount}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.floor(server.rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({server.rating.toFixed(1)})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {server.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {server.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{server.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {server.capabilities.slice(0, 2).map(capability => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {server.capabilities.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{server.capabilities.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(server.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      API
                    </Button>
                    {server.websocketUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(server.websocketUrl, '_blank')}
                      >
                        <Network className="w-3 h-3 mr-1" />
                        WS
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onConnect(server.id)}
                      disabled={server.status !== 'online'}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredServers.map(server => (
              <Card key={server.id} className="hover:shadow-md transition-shadow border-yellow-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {getCategoryIcon(server.category)}
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      {server.verified && <Shield className="w-4 h-4 text-purple-500" />}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusColor(server.status))}
                    >
                      {getStatusIcon(server.status)}
                      <span className="ml-1">{server.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{server.description}</p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Author:</span>
                    <span>{server.author}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version:</span>
                    <span>{server.version}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span>{formatUptime(server.uptime)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response:</span>
                    <span>{formatResponseTime(server.responseTime)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Users:</span>
                    <span>{server.userCount}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.floor(server.rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({server.rating.toFixed(1)})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {server.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {server.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{server.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(server.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      API
                    </Button>
                    {server.websocketUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(server.websocketUrl, '_blank')}
                      >
                        <Network className="w-3 h-3 mr-1" />
                        WS
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onConnect(server.id)}
                      disabled={server.status !== 'online'}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verifiedServers.map(server => (
              <Card key={server.id} className="hover:shadow-md transition-shadow border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      {getCategoryIcon(server.category)}
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      {server.featured && <Star className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusColor(server.status))}
                    >
                      {getStatusIcon(server.status)}
                      <span className="ml-1">{server.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{server.description}</p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Author:</span>
                    <span>{server.author}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version:</span>
                    <span>{server.version}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span>{formatUptime(server.uptime)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response:</span>
                    <span>{formatResponseTime(server.responseTime)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Users:</span>
                    <span>{server.userCount}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.floor(server.rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({server.rating.toFixed(1)})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {server.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {server.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{server.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(server.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      API
                    </Button>
                    {server.websocketUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(server.websocketUrl, '_blank')}
                      >
                        <Network className="w-3 h-3 mr-1" />
                        WS
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onConnect(server.id)}
                      disabled={server.status !== 'online'}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connect
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
