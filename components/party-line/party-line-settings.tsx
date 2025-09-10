"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import { getCharacters } from "@/lib/character-utils"

interface PartyLineSettingsProps {
  mode: "local" | "remote"
  setMode: (mode: "local" | "remote") => void
  apiKey: string
  setApiKey: (key: string) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  temperature: number[]
  setTemperature: (temp: number[]) => void
  maxTokens: number[]
  setMaxTokens: (tokens: number[]) => void
  selectedCharacter: string
  setSelectedCharacter: (character: string) => void
}

export function PartyLineSettings({
  mode,
  setMode,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  selectedCharacter,
  setSelectedCharacter
}: PartyLineSettingsProps) {
  const [characters, setCharacters] = React.useState(() => getCharacters())

  // Refresh characters when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setCharacters(getCharacters())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-md">
        <DialogHeader>
          <DialogTitle>Party Line Settings</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
          <div>
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as "local" | "remote")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="gpt-4o-mini">⭐ GPT-4o Mini (Recommended for chat)</SelectItem>
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
  )
}
