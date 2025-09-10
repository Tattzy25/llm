"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Save, Plus, Eye, RotateCcw, Upload, ImageIcon, Check } from 'lucide-react'

// Robot images you provided - converted to objects for better UI
const ROBOT_IMAGES = [
  { id: 1, name: "Robot Warrior", url: "https://i.imgur.com/knWGczP.png" },
  { id: 2, name: "Android Guardian", url: "https://i.imgur.com/LctgqQi.png" },
  { id: 3, name: "Cyber Knight", url: "https://i.imgur.com/tJ8gK9v.png" },
  { id: 4, name: "Bot Assistant", url: "https://i.imgur.com/wbcNaeE.png" },
  { id: 5, name: "Mech Fighter", url: "https://i.imgur.com/ZDr6TZH.png" },
  { id: 6, name: "AI Companion", url: "https://i.imgur.com/iRNiUox.png" },
  { id: 7, name: "Droid Helper", url: "https://i.imgur.com/00kctzS.png" },
  { id: 8, name: "Robot Scout", url: "https://i.imgur.com/X0WePT9.png" },
  { id: 9, name: "Cyber Sentinel", url: "https://i.imgur.com/B7MJV87.png" },
  { id: 10, name: "Bot Engineer", url: "https://i.imgur.com/d1afv4l.png" },
  { id: 11, name: "AI Analyst", url: "https://i.imgur.com/Pe9b3DU.png" },
  { id: 12, name: "Robo Creator", url: "https://i.imgur.com/rH4H6Jq.png" },
  { id: 13, name: "Tech Guardian", url: "https://i.imgur.com/jAm06jg.png" },
  { id: 14, name: "Data Keeper", url: "https://i.imgur.com/lRNiWWN.png" },
  { id: 15, name: "Code Master", url: "https://i.imgur.com/Fnx7nzb.png" },
  { id: 16, name: "AI Mentor", url: "https://i.imgur.com/3n4jAFI.png" },
  { id: 17, name: "Cyber Sage", url: "https://i.imgur.com/ekREzpT.png" },
  { id: 18, name: "Bot Wizard", url: "https://i.imgur.com/WD9qthT.png" },
  { id: 19, name: "Neural Net", url: "https://i.imgur.com/0oeewhf.png" },
  { id: 20, name: "Logic Core", url: "https://i.imgur.com/GDAt5af.png" },
  { id: 21, name: "Algorithm", url: "https://i.imgur.com/1uGT36l.png" },
  { id: 22, name: "Quantum Bot", url: "https://i.imgur.com/7RxZ6BL.png" },
  { id: 23, name: "Data Miner", url: "https://i.imgur.com/4XPRgs5.png" },
  { id: 24, name: "AI Oracle", url: "https://i.imgur.com/9Bio7FC.png" },
  { id: 25, name: "Robo Genius", url: "https://i.imgur.com/d9F52s9.png" },
]

const MODEL_TYPES = [
  "Text Generation",
  "Image Generation", 
  "Code Generation",
  "Multimodal",
  "Audio Processing",
  "Video Generation",
  "3D Modeling",
  "Voice Synthesis",
  "Music Generation", 
  "Translation",
  "Summarization",
  "Question Answering",
  "Sentiment Analysis",
  "Classification",
  "Named Entity Recognition",
  "OCR",
  "Document Processing",
  "Embeddings",
  "Fine-tuning",
  "RAG (Retrieval)",
  "Function Calling",
  "Reasoning",
  "Mathematical",
  "Scientific",
  "Medical",
  "Legal",
  "Financial",
  "Custom"
]

const PROVIDERS = [
  "OpenAI",
  "Anthropic", 
  "Google",
  "Meta",
  "Mistral",
  "Cohere",
  "Amazon Bedrock",
  "Microsoft Azure",
  "IBM Watson",
  "Hugging Face",
  "Stability AI",
  "Midjourney",
  "RunwayML",
  "Replicate",
  "Together AI",
  "Anyscale",
  "Fireworks",
  "Groq",
  "Cerebras",
  "AI21 Labs",
  "Writer",
  "Character.AI",
  "Perplexity",
  "Reka",
  "xAI",
  "Inflection",
  "Adept",
  "DeepMind",
  "Claude",
  "PaLM",
  "LaMDA",
  "Custom"
]

interface ModelCardData {
  id: string
  name: string
  description: string
  provider: string
  modelType: string
  contextWindow: string
  responseTime: string
  imageUrl: string
  customImageUrl?: string
  status: 'Available' | 'Busy' | 'Offline'
  usageCount: number
}

interface ModelCardPreviewProps {
  data: ModelCardData
  isFlipped: boolean
  onFlip: () => void
}

// Professional Model Card Component (based on your second template)
function ModelCardPreview({ data, isFlipped, onFlip }: ModelCardPreviewProps) {
  // Truncate description to 2-3 lines (approximately 120 characters)
  const truncatedDescription = data.description.length > 120 
    ? data.description.substring(0, 120) + "..." 
    : data.description

  // Status color logic
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-gradient-to-r from-green-500 to-emerald-500'
      case 'Busy': return 'bg-gradient-to-r from-yellow-500 to-amber-500'
      case 'Offline': return 'bg-gradient-to-r from-gray-500 to-slate-500'
      default: return 'bg-gradient-to-r from-green-500 to-emerald-500'
    }
  }

  return (
    <div className="relative flex w-80 flex-col rounded-xl bg-gradient-to-br from-white to-gray-50 bg-clip-border text-gray-700 transition-all duration-300 hover:-translate-y-2 shadow-[0_10px_30px_rgba(249,115,22,0.3),0_0_0_1px_rgba(249,115,22,0.1)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.4),0_0_0_1px_rgba(249,115,22,0.2)]">
      {/* Card Header with Robot Image */}
      <div className="relative mx-4 -mt-6 h-48 overflow-hidden rounded-xl bg-clip-border shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse" />
        
        {/* Robot Image - Made Bigger */}
        <div className="absolute inset-0 flex items-center justify-center">
          {data.imageUrl || data.customImageUrl ? (
            <img 
              src={data.customImageUrl || data.imageUrl} 
              alt={data.name}
              className="w-28 h-28 object-contain transform transition-transform group-hover:scale-125 duration-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
            />
          ) : (
            <div className="w-28 h-28 bg-white/20 rounded-lg flex items-center justify-center text-white text-lg font-semibold">
              IMG
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getStatusColor(data.status)} text-white font-semibold px-3 py-1 shadow-lg`}>
            {data.status}
          </Badge>
        </div>

        {/* Provider Logo Placeholder - Bottom Left */}
        <div className="absolute bottom-3 left-3">
          <div className="w-8 h-8 bg-white/90 rounded-md flex items-center justify-center shadow-md">
            <span className="text-xs font-bold text-gray-700">
              {data.provider ? data.provider.substring(0, 2).toUpperCase() : "AI"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {!isFlipped ? (
          // Front View
          <>
            <div className="flex items-center justify-between mb-3">
              <h5 className="block font-mono text-xl font-bold leading-snug tracking-normal text-gray-900 antialiased group-hover:text-orange-600 transition-colors duration-300">
                {data.name || "Model Name"}
              </h5>
              <Badge variant="outline" className="font-semibold">{data.provider || "Provider"}</Badge>
            </div>
            <p className="block font-sans text-base font-light leading-relaxed text-gray-700 antialiased mb-3 h-12 overflow-hidden">
              {truncatedDescription || "Model description goes here..."}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 font-mono">
              <span>{data.modelType || "Text"}</span>
              <span>•</span>
              <span>~{data.responseTime || "2.3s"}</span>
              <span>•</span>
              <span>{data.usageCount || 0} uses</span>
            </div>
          </>
        ) : (
          // Back View - Detailed Info
          <>
            <h5 className="text-lg font-bold text-gray-900 mb-4 font-mono">Model Specifications</h5>
            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600">Context Window:</span>
                <span className="font-semibold">{data.contextWindow || "128K tokens"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-semibold">~{data.responseTime || "2.3s"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-semibold">{data.modelType || "Text Generation"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Usage:</span>
                <span className="font-semibold">{data.usageCount || 0} times</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="font-semibold">{data.provider || "Unknown"}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-gray-600 font-sans">Use Cases: Creative writing, Code generation, Analysis</p>
            </div>
          </>
        )}
      </div>

      {/* Card Actions */}
      <div className="p-6 pt-0">
        <div className="flex gap-2">
            <Button 
            onClick={onFlip}
            variant="outline"
            size="sm"
            className="flex-1 font-semibold shadow-[0_4px_12px_rgba(249,115,22,0.2)] hover:shadow-[0_6px_16px_rgba(249,115,22,0.3)]"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {isFlipped ? "Front" : "Details"}
          </Button>
          <Button 
            size="sm"
            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 font-semibold shadow-[0_6px_20px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.5)]"
          >
            <Eye className="w-4 h-4 mr-1" />
            Try Model
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ControlPanelRobots() {
  const [isFlipped, setIsFlipped] = useState(false)
  const [formData, setFormData] = useState<ModelCardData>({
    id: '',
    name: '',
    description: '',
    provider: '',
    modelType: 'Text',
    contextWindow: '128K tokens',
    responseTime: '2.3s',
    imageUrl: ROBOT_IMAGES[0].url,
    status: 'Available',
    usageCount: 0
  })

  const handleInputChange = (field: keyof ModelCardData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    console.log('Saving model card:', formData)
    // TODO: Implement save functionality to update the Models page
    alert('Model card saved! (Implementation needed to update Models page)')
  }

  const handleReset = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      provider: '',
      modelType: 'Text',
      contextWindow: '128K tokens',
      responseTime: '2.3s',
      imageUrl: ROBOT_IMAGES[0].url,
      status: 'Available',
      usageCount: 0
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Robot Model Management</h1>
        <p className="text-muted-foreground">
          Create and manage AI model cards for the Models showcase page.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Model Card
            </CardTitle>
            <CardDescription>
              Fill in the details for your AI model card. Changes will be reflected in the preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Model Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., GPT-4o, Claude Sonnet"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              {/* Enhanced Provider Selector */}
              <div className="space-y-2">
                <Label htmlFor="provider" className="font-semibold">Provider</Label>
                <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or enter custom provider name..."
                  value={formData.provider && !PROVIDERS.includes(formData.provider) ? formData.provider : ""}
                  onChange={(e) => handleInputChange('provider', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the model's capabilities..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Enhanced Model Type Selector */}
              <div className="space-y-2">
                <Label htmlFor="modelType" className="font-semibold">Model Type</Label>
                <Select value={formData.modelType} onValueChange={(value) => handleInputChange('modelType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {MODEL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or enter custom model type..."
                  value={formData.modelType && !MODEL_TYPES.includes(formData.modelType) ? formData.modelType : ""}
                  onChange={(e) => handleInputChange('modelType', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'Available' | 'Busy' | 'Offline') => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contextWindow">Context Window</Label>
                <Input
                  id="contextWindow"
                  placeholder="e.g., 128K tokens"
                  value={formData.contextWindow}
                  onChange={(e) => handleInputChange('contextWindow', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="responseTime">Response Time</Label>
                <Input
                  id="responseTime"
                  placeholder="e.g., 2.3s"
                  value={formData.responseTime}
                  onChange={(e) => handleInputChange('responseTime', e.target.value)}
                />
              </div>
            </div>

            {/* Robot Image Selector - Thumbnail Grid */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="font-semibold">Robot Avatar</Label>
              <div className="grid grid-cols-6 gap-2 mb-2">
                {ROBOT_IMAGES.map((robot) => (
                  <button
                    key={robot.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: robot.url, customImageUrl: "" })}
                    className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      formData.imageUrl === robot.url 
                        ? 'border-orange-500 ring-2 ring-orange-200 shadow-lg' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <img
                      src={robot.url}
                      alt={robot.name}
                      className="w-full h-full object-contain rounded-md"
                      title={robot.name}
                    />
                    {formData.imageUrl === robot.url && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Custom Image Upload Option */}
              <div className="mt-3 space-y-2">
                <Label className="text-sm text-gray-600">Or use custom image URL:</Label>
                <Input
                  placeholder="https://example.com/your-image.png"
                  value={formData.customImageUrl || ""}
                  onChange={(e) => setFormData({ ...formData, customImageUrl: e.target.value, imageUrl: "" })}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Model Card
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </CardTitle>
            <CardDescription>
              Preview how your model card will appear on the Models page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <ModelCardPreview 
                data={formData}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
