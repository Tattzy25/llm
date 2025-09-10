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
  const [isRecording, setIsRecording] = React.useState(false)

  // Settings state
  const [selectedModel, setSelectedModel] = React.useState(modelOverride || process.env.NEXT_PUBLIC_DEFAULT_MODEL || "gpt-4o-mini")
  const [selectedCharacter, setSelectedCharacter] = React.useState(characterOverride || "assistant")
  const [mode, setMode] = React.useState<"local" | "remote">("remote")
  const [temperature, setTemperature] = React.useState([parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || "0.7")])
  const [maxTokens, setMaxTokens] = React.useState([parseInt(process.env.NEXT_PUBLIC_DEFAULT_MAX_TOKENS || "4096")])
  const [apiKey, setApiKey] = React.useState("")

  // Load API key from environment or localStorage
  React.useEffect(() => {
    const loadApiKey = () => {
      // Try to get from environment variables first
      const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
      
      // If not in env, try localStorage (from env vars page)
      if (!envKey) {
        const storedEnvVars = localStorage.getItem(`env-vars-${getCurrentUserId()}`)
        if (storedEnvVars) {
          const envVars = JSON.parse(storedEnvVars)
          const openaiKey = envVars.find((v: any) => v.key === 'OPENAI_API_KEY')
          if (openaiKey && openaiKey.value && !openaiKey.value.startsWith('your_')) {
            setApiKey(openaiKey.value)
            return
          }
        }
      }
      
      // Fallback to env var
      if (envKey && !envKey.startsWith('your_')) {
        setApiKey(envKey)
      }
    }
    
    loadApiKey()
  }, [])

  // Helper function to get current user ID
  const getCurrentUserId = () => {
    // Replace with your actual user ID logic
    return 'user-123'
  }

  // Initialize chat service
  const chatService = React.useMemo(() => new ChatService({
    model: selectedModel,
    temperature: temperature[0],
    maxTokens: maxTokens[0],
    apiKey: apiKey,
    character: selectedCharacter,
    stream: true // Enable streaming for real-time responses
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

      await chatService.sendMessage(input, (chunk: string) => {
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

  const handleVoiceRecording = () => {
    setIsRecording(!isRecording)
    showError(isRecording ? 'Voice recording stopped' : 'Voice recording started - speak now', 'Voice Input')
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
        isRecording={isRecording}
        onVoiceRecording={handleVoiceRecording}
        selectedCharacter={selectedCharacter}
        onCharacterSelect={setSelectedCharacter}
      />
    </div>
  )
}
