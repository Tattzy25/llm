"use client"

import * as React from "react"
import { Bot } from "lucide-react"
import { ChatService, ChatMessage } from "@/lib/chat-service"
import { useErrorHandler, errorUtils } from "@/components/error-boundary"
import { PartyLineSettings, MessageList, InputArea } from "./party-line/"

export function PartyLine({ characterOverride, modelOverride, compact = false }: {
  characterOverride?: string
  modelOverride?: string
  compact?: boolean
} = {}) {
  const { showError } = useErrorHandler()

  // State management
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([])
  const [isRecording, setIsRecording] = React.useState(false)
  const [isDeepResearch, setIsDeepResearch] = React.useState(false)

  // Settings state
  const [selectedModel, setSelectedModel] = React.useState(modelOverride || process.env.NEXT_PUBLIC_DEFAULT_MODEL || "gpt-4")
  const [selectedCharacter, setSelectedCharacter] = React.useState(characterOverride || "assistant")
  const [mode, setMode] = React.useState<"local" | "remote">("remote")
  const [temperature, setTemperature] = React.useState([parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || "0.7")])
  const [maxTokens, setMaxTokens] = React.useState([parseInt(process.env.NEXT_PUBLIC_DEFAULT_MAX_TOKENS || "4096")])
  const [apiKey, setApiKey] = React.useState("")

  // Initialize chat service
  const chatService = React.useMemo(() => new ChatService({
    model: selectedModel,
    temperature: temperature[0],
    maxTokens: maxTokens[0],
    apiKey: apiKey,
    character: selectedCharacter
  }), [selectedModel, temperature, maxTokens, apiKey, selectedCharacter])

  // Event handlers
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      let assistantContent = ""
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "",
        role: "assistant",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      await chatService.sendMessage(input, (chunk) => {
        assistantContent += chunk
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: assistantContent }
            : msg
        ))
      })

    } catch (error) {
      const errorMsg = error instanceof Error ? errorUtils.getUserFriendlyErrorMessage(error) : 'Unknown chat error occurred'
      showError(errorMsg, 'Chat Service')
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: `Sorry, I encountered an error: ${errorMsg}. Please check your API key and try again.`,
        role: "assistant",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
    showError(`Uploaded ${files.length} file(s)`, 'File Upload')
  }

  const handleImageUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
    showError(`Uploaded ${files.length} image(s)`, 'Image Upload')
  }

  const handleVoiceRecording = () => {
    setIsRecording(!isRecording)
    showError(isRecording ? 'Voice recording stopped' : 'Voice recording started - speak now', 'Voice Input')
  }

  const handleDeepResearch = () => {
    setIsDeepResearch(!isDeepResearch)
    showError(isDeepResearch ? 'Deep research disabled' : 'Deep research enabled', 'Research Mode')
  }

  const handleCreateImage = () => {
    showError('Image generation feature coming soon!', 'Image Generation')
  }

  const handleConnections = () => {
    showError('Connections feature coming soon!', 'Connections')
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[80vh]'}`}>
      {/* Header - Fixed at top */}
      {!compact && (
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h2 className="font-semibold">Party Line</h2>
          </div>

          <PartyLineSettings
            mode={mode}
            setMode={setMode}
            apiKey={apiKey}
            setApiKey={setApiKey}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            temperature={temperature}
            setTemperature={setTemperature}
            maxTokens={maxTokens}
            setMaxTokens={setMaxTokens}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
          />
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input Area */}
      <InputArea
        input={input}
        setInput={setInput}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        uploadedFiles={uploadedFiles}
        onRemoveFile={handleRemoveFile}
        isRecording={isRecording}
        isDeepResearch={isDeepResearch}
        onFileUpload={handleFileUpload}
        onImageUpload={handleImageUpload}
        onVoiceRecording={handleVoiceRecording}
        onDeepResearch={handleDeepResearch}
        onCreateImage={handleCreateImage}
        onConnections={handleConnections}
      />
    </div>
  )
}
