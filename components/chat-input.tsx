import React, { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, Mic, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onSendFile?: (file: File) => void
  placeholder?: string
  disabled?: boolean
  isRecording?: boolean
  onStartRecording?: () => void
  onStopRecording?: () => void
  maxLength?: number
}

export function ChatInput({
  onSendMessage,
  onSendFile,
  placeholder = "Type your message...",
  disabled = false,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  maxLength = 4000
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onSendFile) {
      onSendFile(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleRecording = () => {
    if (isRecording && onStopRecording) {
      onStopRecording()
    } else if (!isRecording && onStartRecording) {
      onStartRecording()
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* File attachment button */}
        {onSendFile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        )}

        {/* Voice recording button */}
        {(onStartRecording || onStopRecording) && (
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="sm"
            onClick={handleRecording}
            disabled={disabled}
            className={cn(
              "flex-shrink-0",
              isRecording && "animate-pulse"
            )}
          >
            {isRecording ? (
              <Square className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className="min-h-[44px] max-h-32 resize-none pr-12"
            rows={1}
          />

          {/* Character count */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute bottom-2 right-12 text-xs text-muted-foreground">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>

        {/* Hidden file input */}
        {onSendFile && (
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.txt,.md,.json,.csv"
            aria-label="Upload file"
            title="Upload file"
          />
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-destructive">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          Recording... Click stop when finished
        </div>
      )}
    </div>
  )
}
