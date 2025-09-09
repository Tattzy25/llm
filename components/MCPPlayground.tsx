import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, X } from 'lucide-react';
import { Loader2, Send, Server, Database, Code, FileText, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  metadata?: Record<string, unknown>;
}

interface ToolCall {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface MCPServer {
  id: string;
  name: string;
  type: 'desktop' | 'ai-assistant' | 'database' | 'web-scraper';
  status: 'connected' | 'disconnected' | 'error';
  tools: string[];
  endpoint?: string;
}

const MCPPlayground: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [error, setError] = useState<{title: string; message: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with servers from environment variables
  useEffect(() => {
    const servers: MCPServer[] = [];

    // Desktop Server
    if (process.env.MCP_REMOTE_SERVER_URL) {
      servers.push({
        id: 'desktop-1',
        name: 'Desktop Server',
        type: 'desktop',
        status: 'connected',
        tools: ['read_file', 'write_file', 'list_directory', 'get_system_info', 'run_command'],
        endpoint: process.env.MCP_REMOTE_SERVER_URL
      });
    }

    // AI Assistant Server
    if (process.env.MCP_AI_ASSISTANT_URL) {
      servers.push({
        id: 'ai-assistant-1',
        name: 'AI Assistant',
        type: 'ai-assistant',
        status: 'connected',
        tools: ['analyze_code', 'generate_code', 'review_code', 'optimize_code', 'generate_documentation', 'explain_code_segment', 'suggest_improvements', 'detect_code_smells'],
        endpoint: process.env.MCP_AI_ASSISTANT_URL
      });
    }

    // Database Server
    if (process.env.MCP_DATABASE_URL) {
      servers.push({
        id: 'database-1',
        name: 'Database Connector',
        type: 'database',
        status: 'connected',
        tools: ['connect_database', 'execute_query', 'explore_schema', 'analyze_query_performance', 'export_data', 'get_database_stats', 'disconnect_database', 'list_connections'],
        endpoint: process.env.MCP_DATABASE_URL
      });
    }

    // Web Scraper Server
    if (process.env.MCP_WEB_SCRAPER_URL) {
      servers.push({
        id: 'web-scraper-1',
        name: 'Web Scraper',
        type: 'web-scraper',
        status: 'connected',
        tools: ['scrape_website', 'extract_data', 'analyze_content', 'download_files', 'parse_html'],
        endpoint: process.env.MCP_WEB_SCRAPER_URL
      });
    }

    setServers(servers);
    if (servers.length > 0) {
      setActiveServer(servers[0].id);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeServer) {
      setError({
        title: 'Invalid Input',
        message: 'Please enter a message and select an active server.'
      });
      return;
    }

    // Validate input
    const inputValidation = validateInput(input);
    if (!inputValidation.isValid) {
      setError({
        title: 'Input Validation Error',
        message: inputValidation.error || 'Invalid input'
      });
      return;
    }

    // Validate server connection
    if (!validateServerConnection(activeServer)) {
      setError({
        title: 'Server Connection Error',
        message: 'Selected server is not connected. Please select a connected server.'
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await callMCPTool(input, activeServer);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
        metadata: response.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setError({
        title: 'MCP Server Error',
        message: `Failed to process your request: ${errorMsg}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const callMCPTool = async (message: string, serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found in available servers`);
    }

    if (server.status !== 'connected') {
      throw new Error(`Server ${server.name} is not connected. Status: ${server.status}`);
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    try {
      // Make actual HTTP request to MCP server
      const response = await fetch(`${server.endpoint}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MCP_API_KEY || ''}`
        },
        body: JSON.stringify({
          message: message,
          server_type: server.type,
          tools: server.tools
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.response || 'Tool executed successfully',
        toolCalls: data.tool_calls || [],
        metadata: {
          server: server.name,
          processing_time: data.processing_time || 0,
          tokens_used: data.tokens_used || 0,
          status: data.status || 'completed'
        }
      };
    } catch (networkError) {
      throw new Error(`Network error calling MCP server: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
    }
  };

  const validateServerConnection = (serverId: string): boolean => {
    const server = servers.find(s => s.id === serverId);
    return server ? server.status === 'connected' : false;
  };

  const validateInput = (input: string): { isValid: boolean; error?: string } => {
    if (!input || input.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (input.length > 5000) {
      return { isValid: false, error: 'Message is too long (max 5000 characters)' };
    }

    return { isValid: true };
  };

  const getServerIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Server className="w-4 h-4" />;
      case 'ai-assistant': return <Code className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'web-scraper': return <FileText className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Server Management */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">MCP Servers</h2>
          <p className="text-sm text-gray-600">Connected MCP servers and tools</p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {servers.map((server) => (
              <Card
                key={server.id}
                className={`cursor-pointer transition-all ${
                  activeServer === server.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveServer(server.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getServerIcon(server.type)}
                      <CardTitle className="text-sm">{server.name}</CardTitle>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {server.tools.slice(0, 3).map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                    {server.tools.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{server.tools.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200">
          <Button className="w-full" variant="outline">
            <Server className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">MCP Playground</h1>
              <p className="text-sm text-gray-600">
                {activeServer
                  ? `Connected to ${servers.find(s => s.id === activeServer)?.name}`
                  : 'Select a server to start chatting'
                }
              </p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Live</span>
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Welcome to MCP Playground</p>
                <p className="text-sm">Start a conversation with your MCP servers</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? 'bg-red-100 text-red-900'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>

                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <Separator />
                      <p className="text-xs font-medium text-gray-600">Tool Calls:</p>
                      {message.toolCalls.map((toolCall) => (
                        <div key={toolCall.id} className="text-xs bg-gray-100 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {toolCall.tool}
                            </Badge>
                            <span className={`px-2 py-1 rounded text-xs ${
                              toolCall.status === 'completed' ? 'bg-green-100 text-green-800' :
                              toolCall.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {toolCall.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[70%]">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Processing with MCP server...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your MCP servers anything..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={!activeServer || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || !activeServer || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {activeServer && (
            <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
              <span>Active server:</span>
              <Badge variant="secondary">
                {servers.find(s => s.id === activeServer)?.name}
              </Badge>
              <span>•</span>
              <span>{servers.find(s => s.id === activeServer)?.tools.length} tools available</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Dialog */}
      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>{error?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {error?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setError(null)} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MCPPlayground;
