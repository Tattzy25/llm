"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, User } from "lucide-react"
import { ChatMessage } from "@/lib/chat-service"

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="flex-1 overflow-hidden min-h-0">
      <div className="h-full overflow-y-auto p-4 space-y-4">
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
    </div>
  );
}
