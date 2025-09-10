import React from "react"
import { Zap, Star, Users, Palette, Eye, BookOpen, Microscope, Code, Globe, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { CharacterFormData, CharacterCapabilities } from "../types"

interface CapabilitiesTabProps {
  characterForm: CharacterFormData
  onUpdateCharacterForm: (field: keyof CharacterFormData, value: CharacterFormData[keyof CharacterFormData]) => void
}

export function CapabilitiesTab({
  characterForm,
  onUpdateCharacterForm
}: CapabilitiesTabProps) {
  const capabilities = [
    {
      key: 'voice',
      name: 'Voice Synthesis',
      description: 'Text-to-speech and speech-to-text capabilities',
      icon: Users,
      color: 'text-blue-500',
      preview: '🎤 "Hello, I can speak!"'
    },
    {
      key: 'imageGeneration',
      name: 'Image Creation',
      description: 'Generate images from text descriptions',
      icon: Palette,
      color: 'text-pink-500',
      preview: '🎨 Creates stunning visuals'
    },
    {
      key: 'imageAnalysis',
      name: 'Vision Analysis',
      description: 'Analyze and understand images',
      icon: Eye,
      color: 'text-green-500',
      preview: '👁️ "I see a beautiful sunset"'
    },
    {
      key: 'fileProcessing',
      name: 'File Wizardry',
      description: 'Process and analyze documents',
      icon: BookOpen,
      color: 'text-purple-500',
      preview: '📄 Extracts insights from files'
    },
    {
      key: 'deepResearch',
      name: 'Deep Research',
      description: 'Conduct comprehensive investigations',
      icon: Microscope,
      color: 'text-indigo-500',
      preview: '🔬 Uncovers hidden patterns'
    },
    {
      key: 'codeExecution',
      name: 'Code Runner',
      description: 'Execute and test code snippets',
      icon: Code,
      color: 'text-orange-500',
      preview: '💻 Runs code in real-time'
    },
    {
      key: 'apiCalling',
      name: 'API Master',
      description: 'Make external API calls and integrations',
      icon: Globe,
      color: 'text-cyan-500',
      preview: '🌐 Connects to external services'
    },
    {
      key: 'webBrowsing',
      name: 'Web Explorer',
      description: 'Browse and analyze web content',
      icon: Zap,
      color: 'text-red-500',
      preview: '🕸️ Surfs the digital ocean'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Superpowers</h3>
        <Badge variant="secondary" className="ml-auto">
          {Object.values(characterForm.capabilities).filter(Boolean).length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capabilities.map((capability) => {
          const IconComponent = capability.icon
          const isEnabled = characterForm.capabilities[capability.key as keyof typeof characterForm.capabilities]
          return (
            <Card
              key={capability.key}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                isEnabled
                  ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() =>
                onUpdateCharacterForm('capabilities', {
                  ...characterForm.capabilities,
                  [capability.key]: !characterForm.capabilities[capability.key as keyof typeof characterForm.capabilities]
                })
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                  }`}>
                    <IconComponent className={`h-5 w-5 ${capability.color} ${
                      isEnabled ? 'animate-pulse' : ''
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{capability.name}</h4>
                      {isEnabled && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {capability.description}
                    </p>
                    <div className={`text-xs p-2 rounded transition-all duration-300 ${
                      isEnabled
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}>
                      {capability.preview}
                    </div>
                  </div>
                  <Checkbox
                    checked={isEnabled}
                    onChange={() => {}} // Handled by card click
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Capability Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-purple-500" />
            <h4 className="font-medium text-sm">Character Power Level</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(characterForm.capabilities)
              .filter(([, enabled]) => enabled)
              .map(([key]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Badge>
              ))}
            {Object.values(characterForm.capabilities).filter(Boolean).length === 0 && (
              <p className="text-xs text-muted-foreground">No superpowers selected yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
