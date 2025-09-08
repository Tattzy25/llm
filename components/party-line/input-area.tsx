"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Image as ImageIcon, Mic, Search, Wand2, Network, Upload } from "lucide-react"

interface InputAreaProps {
  input: string
  setInput: (value: string) => void
  onSendMessage: () => void
  isLoading: boolean
  uploadedFiles: File[]
  onRemoveFile: (index: number) => void
  isRecording: boolean
  isDeepResearch: boolean
  onFileUpload: (files: File[]) => void
  onImageUpload: (files: File[]) => void
  onVoiceRecording: () => void
  onDeepResearch: () => void
  onCreateImage: () => void
  onConnections: () => void
}

export function InputArea({
  input,
  setInput,
  onSendMessage,
  isLoading,
  uploadedFiles,
  onRemoveFile,
  isRecording,
  isDeepResearch,
  onFileUpload,
  onImageUpload,
  onVoiceRecording,
  onDeepResearch,
  onCreateImage,
  onConnections
}: InputAreaProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const imageInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    onFileUpload(files)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    onImageUpload(files)
  }

  return (
    <div className="border-t flex-shrink-0 bg-background">
      <div className="p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onSendMessage()
              }
            }}
          />
          <Button
            onClick={onSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Feature Icons Row */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t">
          {/* File Upload */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
              aria-label="Upload files"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
              title="Upload Files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          {/* Image Upload */}
          <div className="relative">
            <input
              ref={imageInputRef}
              type="file"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
              aria-label="Upload images"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              className="h-8 w-8 p-0"
              title="Upload Images"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Voice Recording */}
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="sm"
            onClick={onVoiceRecording}
            className="h-8 w-8 p-0"
            title="Voice Input"
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
          </Button>

          {/* Deep Research */}
          <Button
            variant={isDeepResearch ? "default" : "ghost"}
            size="sm"
            onClick={onDeepResearch}
            className="h-8 w-8 p-0"
            title="Deep Research"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Create Image */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateImage}
            className="h-8 w-8 p-0"
            title="Create Image"
          >
            <Wand2 className="h-4 w-4" />
          </Button>

          {/* Connections */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onConnections}
            className="h-8 w-8 p-0"
            title="Connections"
          >
            <Network className="h-4 w-4" />
          </Button>
        </div>

        {/* File Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                <Upload className="h-3 w-3" />
                <span className="truncate max-w-20">{file.name}</span>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
