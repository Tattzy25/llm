"use client"

import * as React from "react"
import { Bot, Send, Settings, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { ChatService, ChatMessage } from "@/lib/chat-service"
import { getCharacters } from "@/lib/character-utils"
import { useErrorHandler } from "@/components/error-boundary"

export function PartyLine({ characterOverride, modelOverride, compact = false }: {
  characterOverride?: string
  modelOverride?: string
  compact?: boolean
} = {}) {
  const { showError } = useErrorHandler()
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState(modelOverride || process.env.NEXT_PUBLIC_DEFAULT_MODEL || "gpt-4")
  const [selectedCharacter, setSelectedCharacter] = React.useState(characterOverride || "assistant")
  const [mode, setMode] = React.useState<"local" | "remote">("remote")
  const [temperature, setTemperature] = React.useState([parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || "0.7")])
  const [maxTokens, setMaxTokens] = React.useState([parseInt(process.env.NEXT_PUBLIC_DEFAULT_MAX_TOKENS || "4096")])
  const [apiKey, setApiKey] = React.useState("")
  const [characters, setCharacters] = React.useState(() => {
    try {
      return getCharacters()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load characters')
      return []
    }
  })
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const chatService = React.useMemo(() => new ChatService({
    model: selectedModel,
    temperature: temperature[0],
    maxTokens: maxTokens[0],
    apiKey: apiKey,
    character: selectedCharacter
  }), [selectedModel, temperature, maxTokens, apiKey, selectedCharacter])

  // Refresh characters when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setCharacters(getCharacters())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

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
      console.error("Chat error:", error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown chat error occurred'
      showError(`Chat failed: ${errorMsg}`)
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

  return (
    <div className={`flex flex-col h-full ${compact ? 'min-h-0' : ''}`}>
      {/* Header - hide in compact mode */}
      {!compact && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h2 className="font-semibold">Party Line</h2>
            <Badge variant="secondary">{mode}</Badge>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Party Line Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Mode</Label>
                  <Tabs value={mode} onValueChange={(value) => setMode(value as "local" | "remote")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="local">Local</TabsTrigger>
                      <TabsTrigger value="remote">Remote</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                  />
                </div>

                <div>
                  <Label>Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Recommended models for chat */}
                      <SelectItem value="gpt-4">⭐ GPT-4 (Recommended for chat)</SelectItem>
                      <SelectItem value="claude-sonnet-4-20250514">⭐ Claude Sonnet 4 (Recommended for chat)</SelectItem>
                      <SelectItem value="llama-3.3-70b-versatile">⭐ Llama 3.3 70B (Recommended for chat)</SelectItem>
                      <SelectItem value="groq/compound">⭐ Groq Compound (Recommended for chat)</SelectItem>

                      {/* OpenAI Models */}
                      <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                      <SelectItem value="gpt-5-2025-08-07">GPT-5 (2025-08-07)</SelectItem>
                      <SelectItem value="o3">O3</SelectItem>
                      <SelectItem value="o4-mini">O4 Mini</SelectItem>
                      <SelectItem value="gpt-4o-mini-tts">GPT-4o Mini TTS</SelectItem>

                      {/* Groq API Models */}
                      <SelectItem value="openai/gpt-oss-120b">OpenAI GPT-OSS 120B</SelectItem>
                      <SelectItem value="openai/gpt-oss-20b">OpenAI GPT-OSS 20B</SelectItem>
                      <SelectItem value="groq/compound-mini">Groq Compound Mini</SelectItem>
                      <SelectItem value="meta-llama/llama-4-maverick-17b-128e-instruct">Meta Llama 4 Maverick 17B</SelectItem>
                      <SelectItem value="meta-llama/llama-4-scout-17b-16e-instruct">Meta Llama 4 Scout 17B</SelectItem>

                      {/* Ollama Local Models */}
                      <SelectItem value="relayavi/ollamik">RelayAVI Ollamik</SelectItem>
                      <SelectItem value="gpt-oss-20b">GPT-OSS 20B (Local)</SelectItem>
                      <SelectItem value="gpt-oss-120b">GPT-OSS 120B (Local)</SelectItem>
                      <SelectItem value="deepseek-r1:671b">DeepSeek R1 671B (Local)</SelectItem>
                      <SelectItem value="gemma3:27b">Gemma 3 27B (Local)</SelectItem>
                      <SelectItem value="llama3:70b">Llama 3 70B (Local)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    ⭐ Recommended models are optimized for conversational AI
                  </p>
                </div>

                <div>
                  <Label>Temperature: {temperature[0]}</Label>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Max Tokens: {maxTokens[0]}</Label>
                  <Slider
                    value={maxTokens}
                    onValueChange={setMaxTokens}
                    max={8192}
                    min={256}
                    step={256}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Character/Persona</Label>
                  <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((character) => (
                        <SelectItem key={character.id} value={character.id}>
                          {character.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="tts" />
                  <Label htmlFor="tts">Text-to-Speech</Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className={`flex-1 ${compact ? 'p-2' : 'p-4'}`}>
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className={message.role === "user" ? "ml-12" : "mr-12"}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  {message.role === "user" ? (
                    <User className="h-4 w-4 mt-1" />
                  ) : (
                    <Bot className="h-4 w-4 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {isLoading && (
            <Card className="mr-12">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className={`${compact ? 'p-2' : 'p-4'} border-t`}>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
