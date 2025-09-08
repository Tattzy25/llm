"use client"

import * as React from "react"
import { Plus, X, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PartyLine } from "@/components/party-line"

interface ChatWindow {
  id: string
  title: string
  character: string
  model: string
}

interface MultiChatProps {
  selectedCharacter: string
  selectedModel: string
}

export function MultiChat({ selectedCharacter, selectedModel }: MultiChatProps) {
  const [chatWindows, setChatWindows] = React.useState<ChatWindow[]>([
    {
      id: "main",
      title: "Main Chat",
      character: selectedCharacter,
      model: selectedModel
    }
  ])

  const addChatWindow = () => {
    const newWindow: ChatWindow = {
      id: `chat-${Date.now()}`,
      title: `Chat ${chatWindows.length + 1}`,
      character: selectedCharacter,
      model: selectedModel
    }
    setChatWindows(prev => [...prev, newWindow])
  }

  const removeChatWindow = (id: string) => {
    if (chatWindows.length > 1) {
      setChatWindows(prev => prev.filter(window => window.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-Chat Interface</h2>
          <p className="text-muted-foreground">
            Chat with multiple AI personalities simultaneously
          </p>
        </div>
        <Button onClick={addChatWindow} disabled={chatWindows.length >= 4}>
          <Plus className="h-4 w-4 mr-2" />
          Add Chat
        </Button>
      </div>

      <div className={`grid gap-4 ${
        chatWindows.length === 1 ? 'grid-cols-1' :
        chatWindows.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
        chatWindows.length === 3 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' :
        'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
      }`}>
        {chatWindows.map((chatWindow) => (
          <Card key={chatWindow.id} className="flex flex-col h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {chatWindow.title}
              </CardTitle>
              {chatWindows.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChatWindow(chatWindow.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-full">
                <PartyLine
                  characterOverride={chatWindow.character}
                  modelOverride={chatWindow.model}
                  compact={true}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chatWindows.length === 1 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Click &quot;Add Chat&quot; to open multiple conversations simultaneously</p>
        </div>
      )}
    </div>
  )
}
