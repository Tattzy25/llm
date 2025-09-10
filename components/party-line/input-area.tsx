"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Mic } from "lucide-react"
import { getCharacters } from "@/lib/character-utils"

interface InputAreaProps {
  input: string
  setInput: (value: string) => void
  onSendMessage: () => void
  isLoading: boolean
  isRecording: boolean
  onVoiceRecording: () => void
  selectedCharacter: string
  onCharacterSelect: (characterId: string) => void
}

export function InputArea({
  input,
  setInput,
  onSendMessage,
  isLoading,
  isRecording,
  onVoiceRecording,
  selectedCharacter,
  onCharacterSelect
}: InputAreaProps) {
  const characters = React.useMemo(() => getCharacters(), [])

  return (
    <div className="border-t flex-shrink-0 bg-gradient-to-b from-background to-muted/20">
      <div className="p-4">
        {/* Character Selector - Compact above input */}
        <div className="mb-3">
          <Select value={selectedCharacter} onValueChange={onCharacterSelect}>
            <SelectTrigger className="w-full max-w-48 h-8 text-sm shadow-sm border-2 focus:border-primary/50 transition-colors">
              <SelectValue placeholder="Character" />
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

        {/* Input Container with buttons inside */}
        <div className="relative shadow-lg rounded-lg overflow-hidden">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none pr-20 border-0 focus:ring-0 bg-background/80 backdrop-blur-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onSendMessage()
              }
            }}
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button
              onClick={onVoiceRecording}
              disabled={isLoading}
              size="sm"
              className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
              variant={isRecording ? "destructive" : "ghost"}
            >
              <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </Button>
            <Button
              onClick={onSendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
