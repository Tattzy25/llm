import * as React from "react"

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
  recommendedFor: string[]
  strengths: string[]
}

export interface FeatureInfo {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  recommendedModels: string[]
  useCase: string
}

export interface ModelCategory {
  name: string
  icon?: React.ComponentType<{ className?: string }>
  color?: string
  models: ModelInfo[]
}

export interface ModelSelectorProps {
  selectedModel: string
  onModelSelect: (modelId: string) => void
  currentFeature?: string
}

export interface CustomModelData {
  id: string
  name: string
  endpoint: string
  maxTokens: number
  provider: string
}
