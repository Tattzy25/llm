import React, { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChatMessageComponent, ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ModelSelector } from './model-selector'
import { ConnectionStatusComponent, ServerConnection } from './connection-status'
import { DebugPanel, DebugLog } from './debug-panel'
import { Settings, MessageSquare, Users } from 'lucide-react'

interface ChatInterfaceProps {
  initialMessages?: ChatMessage[]
  onSendMessage?: (message: string, model: string) => Promise<void>
  onSendFile?: (file: File) => Promise<void>
  onModelChange?: (model: string) => void
  onSettingsOpen?: () => void
  connections?: ServerConnection[]
  onConnectionAction?: (action: string, serverId: string) => void
  isLoading?: boolean
  streamingMessage?: ChatMessage
  debugMode?: boolean
}

export function ChatInterface({
  initialMessages = [],
  onSendMessage,
  onSendFile,
  onModelChange,
  onSettingsOpen,
  connections = [],
  onConnectionAction,
  isLoading = false,
  streamingMessage,
  debugMode = false
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [selectedModel, setSelectedModel] = useState('gpt-4.1')
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  // Add streaming message to display
  const displayMessages = [...messages]
  if (streamingMessage) {
    displayMessages.push(streamingMessage)
  }

  const handleSendMessage = async (message: string) => {
    if (!onSendMessage) return

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      model: selectedModel
    }

    setMessages(prev => [...prev, userMessage])

    // Add debug log
    addDebugLog('info', `Sending message with model: ${selectedModel}`, 'chat')

    try {
      await onSendMessage(message, selectedModel)
    } catch (error) {
      addDebugLog('error', `Failed to send message: ${error}`, 'chat')
    }
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    onModelChange?.(modelId)
    addDebugLog('info', `Model changed to: ${modelId}`, 'ui')
  }

  const handleFileUpload = async (file: File) => {
    if (!onSendFile) return

    addDebugLog('info', `Uploading file: ${file.name}`, 'file')

    try {
      await onSendFile(file)

      // Add file message
      const fileMessage: ChatMessage = {
        id: `file-${Date.now()}`,
        role: 'user',
        content: `Uploaded file: ${file.name}`,
        timestamp: new Date(),
        model: selectedModel,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      }

      setMessages(prev => [...prev, fileMessage])
    } catch (error) {
      addDebugLog('error', `Failed to upload file: ${error}`, 'file')
    }
  }

  const addDebugLog = (level: DebugLog['level'], message: string, source: string) => {
    const log: DebugLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      level,
      message,
      source
    }
    setDebugLogs(prev => [...prev.slice(-99), log]) // Keep last 100 logs
  }

  const handleConnectionAction = (action: string, serverId: string) => {
    onConnectionAction?.(action, serverId)
    addDebugLog('info', `${action} server: ${serverId}`, 'connection')
  }

  const clearDebugLogs = () => {
    setDebugLogs([])
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h1 className="font-semibold">MCP Playground</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={onSettingsOpen}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="p-4 border-b">
          <ModelSelector
            selectedModel={selectedModel}
            onModelSelect={handleModelChange}
          />
        </div>

        {/* Connection Status */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Connections</span>
            <Badge variant="outline" className="text-xs">
              {connections.filter(c => c.status === 'connected').length}/{connections.length}
            </Badge>
          </div>
          <ConnectionStatusComponent
            connections={connections}
            onReconnect={(id) => handleConnectionAction('reconnect', id)}
            onDisconnect={(id) => handleConnectionAction('disconnect', id)}
            onConnect={(id) => handleConnectionAction('connect', id)}
            compact={true}
          />
        </div>

        {/* Debug Panel Toggle */}
        {debugMode && (
          <div className="p-4">
            <DebugPanel
              logs={debugLogs}
              isVisible={isDebugPanelVisible}
              onToggle={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
              onClearLogs={clearDebugLogs}
            />
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {displayMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Welcome to MCP Playground</h3>
                <p className="text-sm">
                  Start a conversation with your AI model. Choose a model from the sidebar and begin chatting.
                </p>
              </div>
            ) : (
              displayMessages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  isStreaming={streamingMessage?.id === message.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-background">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              onSendFile={handleFileUpload}
              disabled={isLoading}
              isRecording={isRecording}
              onStartRecording={() => setIsRecording(true)}
              onStopRecording={() => setIsRecording(false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
