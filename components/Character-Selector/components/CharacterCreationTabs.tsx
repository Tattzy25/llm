import React from "react"
import { Wand2, Sparkles, Zap, Brain, Target, Check, Plus, X, Settings, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { DigitalIdentityTab } from "./DigitalIdentityTab"
import { CapabilitiesTab } from "./CapabilitiesTab"
import { ModelsTab } from "./ModelsTab"
import { FeaturesTab } from "./FeaturesTab"
import type { CharacterFormData, CustomModelFormData } from "../types"
import { personalityArchetypes, personalityTraits, modelCategories, featureDefinitions } from "../data"

interface CharacterCreationTabsProps {
  characterForm: CharacterFormData
  customModelForm: CustomModelFormData
  showCustomModelForm: boolean
  onSelectArchetype: (archetypeId: string) => void
  onUpdatePersonalityTrait: (traitId: string, value: number) => void
  onGenerateSystemPrompt: () => void
  onToggleModelSelection: (modelId: string) => void
  onUpdateModelSetting: (modelId: string, setting: string, value: number | boolean) => void
  onToggleFeature: (featureId: string) => void
  onAddCustomModel: () => void
  onSetShowCustomModelForm: (show: boolean) => void
  onUpdateCustomModelForm: (field: keyof CustomModelFormData, value: string | number) => void
  onUpdateCharacterForm: (field: keyof CharacterFormData, value: CharacterFormData[keyof CharacterFormData]) => void
  getAllAvailableModels: () => Record<string, { name: string; maxTokens: number; endpoint: string; contextWindow?: number; maxFileSize?: string; provider?: string; [key: string]: unknown }>
  getModelCategory: (modelId: string) => string
  getSelectedModelsInfo: () => Array<{ id: string; config: { name: string; maxTokens: number; endpoint: string; contextWindow?: number; maxFileSize?: string; provider?: string; [key: string]: unknown }; category: string; settings?: unknown }>
  getRecommendedModels: () => string[]
}

export function CharacterCreationTabs({
  characterForm,
  customModelForm,
  showCustomModelForm,
  onSelectArchetype,
  onUpdatePersonalityTrait,
  onGenerateSystemPrompt,
  onToggleModelSelection,
  onUpdateModelSetting,
  onToggleFeature,
  onAddCustomModel,
  onSetShowCustomModelForm,
  onUpdateCustomModelForm,
  onUpdateCharacterForm,
  getAllAvailableModels,
  getModelCategory,
  getSelectedModelsInfo,
  getRecommendedModels
}: CharacterCreationTabsProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Digital DNA
        </TabsTrigger>
        <TabsTrigger value="capabilities" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Superpowers
        </TabsTrigger>
        <TabsTrigger value="models" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Models
        </TabsTrigger>
        <TabsTrigger value="features" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Specializations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-6">
        <DigitalIdentityTab
          characterForm={characterForm}
          onSelectArchetype={onSelectArchetype}
          onUpdatePersonalityTrait={onUpdatePersonalityTrait}
          onGenerateSystemPrompt={onGenerateSystemPrompt}
          onUpdateCharacterForm={onUpdateCharacterForm}
        />
      </TabsContent>

      <TabsContent value="capabilities" className="space-y-6">
        <CapabilitiesTab
          characterForm={characterForm}
          onUpdateCharacterForm={onUpdateCharacterForm}
        />
      </TabsContent>

      <TabsContent value="models" className="space-y-6">
        <ModelsTab
          characterForm={characterForm}
          customModelForm={customModelForm}
          showCustomModelForm={showCustomModelForm}
          onToggleModelSelection={onToggleModelSelection}
          onUpdateModelSetting={onUpdateModelSetting}
          onAddCustomModel={onAddCustomModel}
          onSetShowCustomModelForm={onSetShowCustomModelForm}
          onUpdateCustomModelForm={onUpdateCustomModelForm}
          getAllAvailableModels={getAllAvailableModels}
          getModelCategory={getModelCategory}
          getSelectedModelsInfo={getSelectedModelsInfo}
        />
      </TabsContent>

      <TabsContent value="features" className="space-y-6">
        <FeaturesTab
          characterForm={characterForm}
          onToggleFeature={onToggleFeature}
          onUpdateFeatureSetting={(featureId, setting, value) => {
            // Simple feature toggle - just update preferredFeatures
            const currentFeatures = characterForm.preferredFeatures || []
            const updatedFeatures = currentFeatures.includes(featureId)
              ? currentFeatures.filter(f => f !== featureId)
              : [...currentFeatures, featureId]
            onUpdateCharacterForm('preferredFeatures', updatedFeatures)
          }}
          featureSettings={{}}
        />
      </TabsContent>
    </Tabs>
  )
}
