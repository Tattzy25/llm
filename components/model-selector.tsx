"use client"

import * as React from "react"
import { Bot, Cpu, Zap, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MODEL_CONFIGS } from "@/lib/chat-service"

export interface ModelInfo {
  id: string
  name: string
  provider: string
  category: 'openai' | 'anthropic' | 'groq' | 'local' | 'custom'
  maxTokens: number
  contextWindow: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const modelCategories = {
  openai: {
    name: "OpenAI",
    icon: Zap,
    color: "bg-green-500",
    models: [] as ModelInfo[]
  },
  anthropic: {
    name: "Anthropic",
    icon: Bot,
    color: "bg-orange-500",
    models: [] as ModelInfo[]
  },
  groq: {
    name: "Groq",
    icon: Cpu,
    color: "bg-purple-500",
    models: [] as ModelInfo[]
  },
  local: {
    name: "Local Models",
    icon: Globe,
    color: "bg-blue-500",
    models: [] as ModelInfo[]
  },
  custom: {
    name: "Custom",
    icon: Bot,
    color: "bg-gray-500",
    models: [] as ModelInfo[]
  }
}

// Convert MODEL_CONFIGS to categorized format
Object.entries(MODEL_CONFIGS).forEach(([key, config]) => {
  let category: keyof typeof modelCategories = 'custom'
  let provider = 'Custom'

  if (key.startsWith('gpt-') || key.startsWith('o')) {
    category = 'openai'
    provider = 'OpenAI'
  } else if (key.startsWith('claude-')) {
    category = 'anthropic'
    provider = 'Anthropic'
  } else if (key.includes('groq') || key.startsWith('llama-') || key.startsWith('meta-llama')) {
    category = 'groq'
    provider = 'Groq'
  } else if (key.includes('local') || key === 'llama-2-7b') {
    category = 'local'
    provider = 'Local'
  }

  const modelInfo: ModelInfo = {
    id: key,
    name: config.name,
    provider,
    category,
    maxTokens: config.maxTokens,
    contextWindow: config.maxTokens,
    description: `${provider} model with ${config.maxTokens.toLocaleString()} max tokens`,
    icon: modelCategories[category].icon,
    color: modelCategories[category].color
  }

  modelCategories[category].models.push(modelInfo)
})

interface ModelSelectorProps {
  selectedModel: string
  onModelSelect: (modelId: string) => void
}

export function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<keyof typeof modelCategories>('openai')

  const totalModels = Object.values(modelCategories).reduce((sum, cat) => sum + cat.models.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Model</h2>
        <p className="text-muted-foreground">
          Select from {totalModels} available models across different providers
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(modelCategories).map(([key, category]) => {
          if (category.models.length === 0) return null
          const IconComponent = category.icon
          return (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              onClick={() => setSelectedCategory(key as keyof typeof modelCategories)}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {category.name}
              <Badge variant="secondary" className="ml-1">
                {category.models.length}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modelCategories[selectedCategory].models.map((model) => {
          const IconComponent = model.icon
          return (
            <Card
              key={model.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedModel === model.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onModelSelect(model.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${model.color}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{model.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {model.provider}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <CardDescription className="text-xs">
                    {model.description}
                  </CardDescription>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Max: {model.maxTokens.toLocaleString()}</span>
                    <span>Context: {model.contextWindow.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {modelCategories[selectedCategory].models.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No models available in this category</p>
        </div>
      )}
    </div>
  )
}
