"use client"

import * as React from "react"
import { Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface Character {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  isCustom?: boolean
  createdAt?: string
  updatedAt?: string

  // Advanced customization options
  personality: {
    creativity: number // 0-100
    analytical: number // 0-100
    empathy: number // 0-100
    humor: number // 0-100
    formality: number // 0-100
  }
  capabilities: {
    codeGeneration: boolean
    creativeWriting: boolean
    dataAnalysis: boolean
    teaching: boolean
    research: boolean
    translation: boolean
  }
  constraints: {
    maxResponseLength: number
    avoidTopics: string[]
    preferredStyle: string
    language: string
  }
  modelPreferences: {
    preferredModels: string[]
    avoidModels: string[]
    temperatureRange: [number, number]
    maxTokensRange: [number, number]
  }
}

const languageOptions = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Chinese", "Japanese", "Korean", "Russian"
]

interface CharacterCustomizationProps {
  character: Character
  onCharacterUpdate: (character: Character) => void
  availableModels: string[]
}

export function CharacterCustomization({
  character,
  onCharacterUpdate,
  availableModels
}: CharacterCustomizationProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const updatePersonality = (trait: keyof Character['personality'], value: number) => {
    const updatedCharacter = {
      ...character,
      personality: {
        ...character.personality,
        [trait]: value
      },
      updatedAt: new Date().toISOString()
    }
    onCharacterUpdate(updatedCharacter)
  }

  const updateCapability = (capability: keyof Character['capabilities'], value: boolean) => {
    const updatedCharacter = {
      ...character,
      capabilities: {
        ...character.capabilities,
        [capability]: value
      },
      updatedAt: new Date().toISOString()
    }
    onCharacterUpdate(updatedCharacter)
  }

  const updateConstraint = (field: keyof Character['constraints'], value: string | number | string[]) => {
    const updatedCharacter = {
      ...character,
      constraints: {
        ...character.constraints,
        [field]: value
      },
      updatedAt: new Date().toISOString()
    }
    onCharacterUpdate(updatedCharacter)
  }

  const updateModelPreference = (field: keyof Character['modelPreferences'], value: string[] | [number, number]) => {
    const updatedCharacter = {
      ...character,
      modelPreferences: {
        ...character.modelPreferences,
        [field]: value
      },
      updatedAt: new Date().toISOString()
    }
    onCharacterUpdate(updatedCharacter)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Character: {character.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personality" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personality">Personality</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
            <TabsTrigger value="models">Model Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="personality" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personality Traits</h3>

              <div className="space-y-4">
                <div>
                  <Label>Creativity: {character.personality.creativity}</Label>
                  <Slider
                    value={[character.personality.creativity]}
                    onValueChange={([value]) => updatePersonality('creativity', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Analytical Thinking: {character.personality.analytical}</Label>
                  <Slider
                    value={[character.personality.analytical]}
                    onValueChange={([value]) => updatePersonality('analytical', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Empathy: {character.personality.empathy}</Label>
                  <Slider
                    value={[character.personality.empathy]}
                    onValueChange={([value]) => updatePersonality('empathy', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Humor: {character.personality.humor}</Label>
                  <Slider
                    value={[character.personality.humor]}
                    onValueChange={([value]) => updatePersonality('humor', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Formality: {character.personality.formality}</Label>
                  <Slider
                    value={[character.personality.formality]}
                    onValueChange={([value]) => updatePersonality('formality', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Capabilities</h3>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(character.capabilities).map(([capability, enabled]) => (
                  <div key={capability} className="flex items-center space-x-2">
                    <Switch
                      id={capability}
                      checked={enabled}
                      onCheckedChange={(checked) => updateCapability(capability as keyof Character['capabilities'], checked)}
                    />
                    <Label htmlFor={capability} className="capitalize">
                      {capability.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="constraints" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Constraints & Preferences</h3>

              <div>
                <Label htmlFor="maxResponseLength">Max Response Length (words)</Label>
                <Input
                  id="maxResponseLength"
                  type="number"
                  value={character.constraints.maxResponseLength}
                  onChange={(e) => updateConstraint('maxResponseLength', parseInt(e.target.value) || 500)}
                  min={50}
                  max={2000}
                />
              </div>

              <div>
                <Label htmlFor="preferredStyle">Preferred Writing Style</Label>
                <Input
                  id="preferredStyle"
                  value={character.constraints.preferredStyle}
                  onChange={(e) => updateConstraint('preferredStyle', e.target.value)}
                  placeholder="e.g., formal, casual, technical, creative"
                />
              </div>

              <div>
                <Label htmlFor="language">Primary Language</Label>
                <Select
                  value={character.constraints.language}
                  onValueChange={(value) => updateConstraint('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="avoidTopics">Topics to Avoid (comma-separated)</Label>
                <Textarea
                  id="avoidTopics"
                  value={character.constraints.avoidTopics.join(', ')}
                  onChange={(e) => updateConstraint('avoidTopics', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="e.g., politics, religion, sensitive topics"
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Model Preferences</h3>

              <div>
                <Label>Preferred Models</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableModels.map((model) => (
                    <Badge
                      key={model}
                      variant={character.modelPreferences.preferredModels.includes(model) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = character.modelPreferences.preferredModels
                        const updated = current.includes(model)
                          ? current.filter(m => m !== model)
                          : [...current, model]
                        updateModelPreference('preferredModels', updated)
                      }}
                    >
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Models to Avoid</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableModels.map((model) => (
                    <Badge
                      key={model}
                      variant={character.modelPreferences.avoidModels.includes(model) ? "destructive" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = character.modelPreferences.avoidModels
                        const updated = current.includes(model)
                          ? current.filter(m => m !== model)
                          : [...current, model]
                        updateModelPreference('avoidModels', updated)
                      }}
                    >
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Temperature Range: {character.modelPreferences.temperatureRange[0]} - {character.modelPreferences.temperatureRange[1]}</Label>
                  <Slider
                    value={character.modelPreferences.temperatureRange}
                    onValueChange={(value) => updateModelPreference('temperatureRange', value as [number, number])}
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Max Tokens Range: {character.modelPreferences.maxTokensRange[0]} - {character.modelPreferences.maxTokensRange[1]}</Label>
                  <Slider
                    value={character.modelPreferences.maxTokensRange}
                    onValueChange={(value) => updateModelPreference('maxTokensRange', value as [number, number])}
                    max={8192}
                    min={256}
                    step={256}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
