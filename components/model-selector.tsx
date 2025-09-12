"use client"

import * as React from "react"
import { Bot, Cpu, Zap, Globe, MessageSquare, Code, Palette, BookOpen, Settings, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MODEL_CONFIGS, CUSTOM_MODELS, addCustomModel } from "@/lib/chat-service"

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

// Feature definitions with model recommendations
const features: FeatureInfo[] = [
  {
    id: "chat",
    name: "General Chat",
    description: "Conversational AI for everyday tasks",
    icon: MessageSquare,
    recommendedModels: ["gpt-4", "claude-sonnet-4-20250514", "llama-3.3-70b-versatile", "groq/compound"],
    useCase: "Best for natural conversations, writing assistance, and general Q&A"
  },
  {
    id: "coding",
    name: "Code Generation",
    description: "Programming and development tasks",
    icon: Code,
    recommendedModels: ["gpt-4", "claude-sonnet-4-20250514", "o3", "openai/gpt-oss-120b"],
    useCase: "Best for writing, debugging, and explaining code"
  },
  {
    id: "creative",
    name: "Creative Writing",
    description: "Storytelling and content creation",
    icon: Palette,
    recommendedModels: ["claude-sonnet-4-20250514", "gpt-4", "llama-3.3-70b-versatile", "o3"],
    useCase: "Best for creative writing, storytelling, and content generation"
  },
  {
    id: "analysis",
    name: "Data Analysis",
    description: "Research and analytical tasks",
    icon: Target,
    recommendedModels: ["gpt-4", "claude-sonnet-4-20250514", "o3", "openai/gpt-oss-120b"],
    useCase: "Best for research, analysis, and complex reasoning"
  },
  {
    id: "documentation",
    name: "Documentation",
    description: "Technical writing and documentation",
    icon: BookOpen,
    recommendedModels: ["claude-sonnet-4-20250514", "gpt-4", "o4-mini", "groq/compound-mini"],
    useCase: "Best for clear, structured technical documentation"
  },
  {
    id: "settings",
    name: "Configuration",
    description: "System configuration and setup",
    icon: Settings,
    recommendedModels: ["o4-mini", "groq/compound-mini", "llama3:70b"],
    useCase: "Best for quick configuration tasks and simple instructions"
  }
]

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

// Model strengths and recommendations mapping
const modelStrengths: Record<string, string[]> = {
  "gpt-4": ["Excellent reasoning", "Code generation", "Creative writing", "Complex analysis"],
  "gpt-4.1": ["Advanced reasoning", "Multilingual", "Creative tasks", "Research"],
  "gpt-5-2025-08-07": ["Cutting-edge AI", "Advanced reasoning", "Multimodal", "Research"],
  "o3": ["Optimized performance", "Fast responses", "Technical tasks", "Analysis"],
  "o4-mini": ["Efficient and fast", "Cost-effective", "Simple tasks", "Quick responses"],
  "claude-sonnet-4-20250514": ["Balanced performance", "Technical writing", "Analysis", "Documentation"],
  "openai/gpt-oss-120b": ["Large context window", "Code generation", "Research", "Analysis"],
  "openai/gpt-oss-20b": ["Balanced performance", "General tasks", "Cost-effective", "Fast"],
  "llama-3.3-70b-versatile": ["Open source", "Customizable", "General purpose", "Cost-effective"],
  "groq/compound": ["Fast inference", "Compound AI", "General tasks", "Efficient"],
  "groq/compound-mini": ["Ultra-fast", "Lightweight", "Simple tasks", "Cost-effective"],
  "meta-llama/llama-4-maverick-17b-128e-instruct": ["Advanced reasoning", "Multilingual", "Creative tasks", "Research"],
  "meta-llama/llama-4-scout-17b-16e-instruct": ["Efficient processing", "General tasks", "Fast responses", "Balanced"],
  "relayavi/ollamik": ["Custom Ollama", "Local deployment", "Privacy-focused", "Flexible"],
  "gpt-oss-20b": ["Large context", "Local deployment", "Privacy-focused", "Cost-effective"],
  "gpt-oss-120b": ["Maximum context", "Local deployment", "Research-grade", "Powerful"],
  "deepseek-r1:671b": ["Deep reasoning", "Large model", "Research", "Complex tasks"],
  "gemma3:27b": ["Google's Gemma", "Balanced performance", "General tasks", "Efficient"],
  "llama3:70b": ["Meta's Llama 3", "Large context", "Versatile", "Powerful"]
}

// Convert MODEL_CONFIGS to categorized format with recommendations
Object.entries(MODEL_CONFIGS).forEach(([key, config]) => {
  let category: keyof typeof modelCategories = 'custom'
  let provider = 'Custom'

  if (key.startsWith('gpt-') || key.startsWith('o')) {
    category = 'openai'
    provider = 'OpenAI'
  } else if (key.startsWith('claude-')) {
    category = 'anthropic'
    provider = 'Anthropic'
  } else if (key.includes('groq') || key.startsWith('llama-') || key.startsWith('meta-llama') || key.startsWith('openai/gpt-oss') || key.startsWith('deepseek') || key.startsWith('gemma')) {
    category = 'groq'
    provider = 'Groq'
  } else if (key.includes('local') || key === 'llama3:70b' || key === 'gpt-oss-20b' || key === 'gpt-oss-120b') {
    category = 'local'
    provider = 'Local'
  }

  // Determine recommended features for this model
  const recommendedFor: string[] = []
  features.forEach(feature => {
    if (feature.recommendedModels.includes(key)) {
      recommendedFor.push(feature.id)
    }
  })

  const modelInfo: ModelInfo = {
    id: key,
    name: config.name,
    provider,
    category,
    maxTokens: config.maxTokens,
    contextWindow: 'contextWindow' in config ? config.contextWindow : config.maxTokens,
    description: `${provider} model with ${config.maxTokens.toLocaleString()} max tokens`,
    icon: modelCategories[category].icon,
    color: modelCategories[category].color,
    recommendedFor,
    strengths: modelStrengths[key] || ["General purpose AI", "Versatile applications"]
  }

  modelCategories[category].models.push(modelInfo)
})

// Add custom models to the custom category
Object.entries(CUSTOM_MODELS).forEach(([key, config]) => {
  const modelInfo: ModelInfo = {
    id: key,
    name: config.name,
    provider: config.provider || 'Custom',
    category: 'custom',
    maxTokens: config.maxTokens,
    contextWindow: config.contextWindow || config.maxTokens,
    description: `${config.provider || 'Custom'} model with ${config.maxTokens.toLocaleString()} max tokens`,
    icon: modelCategories.custom.icon,
    color: modelCategories.custom.color,
    recommendedFor: [],
    strengths: ["Custom model", "User-defined"]
  }

  modelCategories.custom.models.push(modelInfo)
})

interface ModelSelectorProps {
  selectedModel: string
  onModelSelect: (modelId: string) => void
  currentFeature?: string
}

export function ModelSelector({ selectedModel, onModelSelect, currentFeature }: ModelSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<keyof typeof modelCategories>('openai')
  const [viewMode, setViewMode] = React.useState<'categories' | 'features'>('categories')
  const [showCustomDialog, setShowCustomDialog] = React.useState(false)
  const [customModelData, setCustomModelData] = React.useState({
    id: '',
    name: '',
    endpoint: '',
    maxTokens: 4096,
    provider: ''
  })

  const totalModels = Object.values(modelCategories).reduce((sum, cat) => sum + cat.models.length, 0)

  // Handle adding custom model
  const handleAddCustomModel = () => {
    if (customModelData.id && customModelData.name && customModelData.endpoint) {
      addCustomModel(customModelData.id, {
        name: customModelData.name,
        maxTokens: customModelData.maxTokens,
        endpoint: customModelData.endpoint,
        provider: customModelData.provider || 'Custom'
      })
      setCustomModelData({ id: '', name: '', endpoint: '', maxTokens: 4096, provider: '' })
      setShowCustomDialog(false)
      // Force re-render by updating state
      setSelectedCategory(selectedCategory)
    }
  }

  // Get recommended models for current feature
  const getRecommendedModels = (featureId: string) => {
    const feature = features.find(f => f.id === featureId)
    if (!feature) return []

    return feature.recommendedModels
      .map(modelId => {
        // Find the model in all categories
        for (const category of Object.values(modelCategories)) {
          const model = category.models.find(m => m.id === modelId)
          if (model) return model
        }
        return null
      })
      .filter(Boolean) as ModelInfo[]
  }

  const recommendedModels = currentFeature ? getRecommendedModels(currentFeature) : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Model</h2>
        <p className="text-muted-foreground">
          Select from {totalModels} available models across different providers
        </p>
        {currentFeature && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Current Feature:</strong> {features.find(f => f.id === currentFeature)?.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {features.find(f => f.id === currentFeature)?.useCase}
            </p>
          </div>
        )}
      </div>

      {/* Custom Model Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            + Add Custom Model
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Model</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="model-id">Model ID</Label>
              <Input
                id="model-id"
                value={customModelData.id}
                onChange={(e) => setCustomModelData(prev => ({ ...prev, id: e.target.value }))}
                placeholder="e.g., my-custom-model"
              />
            </div>
            <div>
              <Label htmlFor="model-name">Model Name</Label>
              <Input
                id="model-name"
                value={customModelData.name}
                onChange={(e) => setCustomModelData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., My Custom Model"
              />
            </div>
            <div>
              <Label htmlFor="model-endpoint">API Endpoint</Label>
              <Input
                id="model-endpoint"
                value={customModelData.endpoint}
                onChange={(e) => setCustomModelData(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="e.g., https://api.example.com/v1/chat/completions"
              />
            </div>
            <div>
              <Label htmlFor="model-provider">Provider (Optional)</Label>
              <Input
                id="model-provider"
                value={customModelData.provider}
                onChange={(e) => setCustomModelData(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="e.g., Custom Provider"
              />
            </div>
            <div>
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                value={customModelData.maxTokens}
                onChange={(e) => setCustomModelData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 }))}
              />
            </div>
            <Button onClick={handleAddCustomModel} className="w-full">
              Add Model
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'categories' | 'features')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">By Provider</TabsTrigger>
          <TabsTrigger value="features">By Feature</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
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
              const isRecommended = currentFeature && model.recommendedFor.includes(currentFeature)
              return (
                <Card
                  key={model.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedModel === model.id ? "ring-2 ring-primary" : ""
                  } ${isRecommended ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}`}
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                            {isRecommended && (
                              <Badge variant="default" className="text-xs bg-green-500">
                                Recommended
                              </Badge>
                            )}
                          </div>
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
                      <div className="flex flex-wrap gap-1 mt-2">
                        {model.strengths.slice(0, 2).map((strength, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          {/* Feature Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => {
              const IconComponent = feature.icon
              const isCurrentFeature = currentFeature === feature.id
              return (
                <Card
                  key={feature.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isCurrentFeature ? "ring-2 ring-primary bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                  onClick={() => {/* Feature selection could trigger model filtering */}}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-sm font-medium">{feature.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {feature.recommendedModels.length} models
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs mb-2">
                      {feature.description}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground">
                      {feature.useCase}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recommended Models for Current Feature */}
          {currentFeature && recommendedModels.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">
                Recommended for {features.find(f => f.id === currentFeature)?.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedModels.map((model) => {
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
                          <div className="flex flex-wrap gap-1 mt-2">
                            {model.strengths.slice(0, 3).map((strength, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {modelCategories[selectedCategory].models.length === 0 && viewMode === 'categories' && (
        <div className="text-center py-8 text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No models available in this category</p>
        </div>
      )}
    </div>
  )
}
