import React from "react"
import { Wand2, Sparkles, Eye, Palette, Brain, Star, Users, Flame, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import type { CharacterFormData } from "../types"
import { personalityArchetypes, personalityTraits } from "../data"

interface DigitalIdentityTabProps {
  characterForm: CharacterFormData
  onSelectArchetype: (archetypeId: string) => void
  onUpdatePersonalityTrait: (traitId: string, value: number) => void
  onGenerateSystemPrompt: () => void
  onUpdateCharacterForm: (field: keyof CharacterFormData, value: CharacterFormData[keyof CharacterFormData]) => void
}

export function DigitalIdentityTab({
  characterForm,
  onSelectArchetype,
  onUpdatePersonalityTrait,
  onGenerateSystemPrompt,
  onUpdateCharacterForm
}: DigitalIdentityTabProps) {
  return (
    <>
      {/* Digital Identity Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Digital Identity</h3>
        </div>

        {/* Personality Archetype Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Choose Your Archetype</Label>
          <div className="grid grid-cols-2 gap-3">
            {personalityArchetypes.map((archetype) => {
              const IconComponent = archetype.icon
              const isSelected = characterForm.archetype === archetype.id
              return (
                <Card
                  key={archetype.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    isSelected
                      ? `ring-2 ring-purple-500 bg-gradient-to-br ${archetype.color} text-white`
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onSelectArchetype(archetype.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-purple-500'}`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{archetype.name}</h4>
                        <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {archetype.description}
                        </p>
                      </div>
                      {isSelected && <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      </div>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Custom Name Input */}
        <div className="space-y-2">
          <Label htmlFor="create-name" className="text-sm font-medium">Character Name</Label>
          <Input
            id="create-name"
            value={characterForm.name}
            onChange={(e) => onUpdateCharacterForm('name', e.target.value)}
            placeholder="Customize your character's name"
            className="text-lg"
          />
        </div>
      </div>

      {/* Personality DNA Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Personality DNA</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateSystemPrompt}
            className="ml-auto"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate Prompt
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {personalityTraits.map((trait) => {
            const IconComponent = trait.icon
            const value = characterForm.personality[trait.id] || 50
            return (
              <div key={trait.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconComponent className={`h-4 w-4 ${trait.color}`} />
                  <Label className="text-sm font-medium">{trait.name}</Label>
                  <span className="text-sm text-muted-foreground ml-auto">{value}%</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([newValue]: number[]) => onUpdatePersonalityTrait(trait.id, newValue)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">{trait.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Enhanced Description Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Character Backstory</h3>
        </div>

        <div className="space-y-3">
          <Label htmlFor="create-description" className="text-sm font-medium">Description</Label>
          <Textarea
            id="create-description"
            value={characterForm.description}
            onChange={(e) => onUpdateCharacterForm('description', e.target.value)}
            placeholder="Craft a compelling backstory for your character..."
            rows={3}
            className="resize-none"
          />

          {/* Example Personas */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Example Personas:</Label>
            <div className="flex flex-wrap gap-2">
              {[
                "The Philosophical Mentor - guides with wisdom and patience",
                "The Creative Collaborator - sparks innovation through teamwork",
                "The Data Detective - uncovers patterns and insights",
                "The Strategic Advisor - designs comprehensive solutions",
                "The Bold Innovator - challenges conventions and explores new frontiers",
                "The Empathetic Nurturer - creates safe spaces for growth"
              ].map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs"
                  onClick={() => onUpdateCharacterForm('description', example)}
                >
                  {example.split(' - ')[0]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Theme Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">Visual Theme</h3>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { name: "Cosmic", color: "from-purple-500 to-blue-600", icon: Star },
            { name: "Forest", color: "from-green-500 to-emerald-600", icon: Users },
            { name: "Fire", color: "from-orange-500 to-red-600", icon: Flame },
            { name: "Ocean", color: "from-cyan-500 to-blue-600", icon: Zap }
          ].map((theme) => {
            const IconComponent = theme.icon
            const isSelected = characterForm.visualTheme === theme.color
            return (
              <Card
                key={theme.name}
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? `ring-2 ring-purple-500 bg-gradient-to-br ${theme.color} text-white`
                    : 'hover:shadow-md'
                }`}
                onClick={() => onUpdateCharacterForm('visualTheme', theme.color)}
              >
                <CardContent className="p-3 text-center">
                  <IconComponent className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                  <p className={`text-xs font-medium ${isSelected ? 'text-white' : ''}`}>{theme.name}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* System Prompt Preview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold">System Prompt</h3>
        </div>

        <div className="space-y-2">
          <Textarea
            id="create-systemPrompt"
            value={characterForm.systemPrompt}
            onChange={(e) => onUpdateCharacterForm('systemPrompt', e.target.value)}
            placeholder="Your character's core personality and behavior instructions..."
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            This prompt defines how your character thinks, responds, and behaves. It will be automatically updated based on your personality settings.
          </p>
        </div>
      </div>
    </>
  )
}
