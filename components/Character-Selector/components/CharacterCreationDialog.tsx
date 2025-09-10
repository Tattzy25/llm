import React from "react"
import { Wand2, Sparkles, Zap, Brain, Target, Check, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CharacterCreationTabs } from "./CharacterCreationTabs"
import type { CharacterFormData, CustomModelFormData } from "../types"

interface CharacterCreationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  characterForm: CharacterFormData
  customModelForm: CustomModelFormData
  showCustomModelForm: boolean
  onCreateCharacter: () => void
  onOpenCreateDialog: () => void
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
  getAllAvailableModels: () => Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>
  getModelCategory: (modelId: string) => string
  getSelectedModelsInfo: () => Array<{ id: string; config: { [key: string]: unknown; name: string; maxTokens: number; endpoint: string; contextWindow?: number; maxFileSize?: string; provider?: string }; category: string; settings?: unknown }>
  getRecommendedModels: () => string[]
}

export function CharacterCreationDialog({
  isOpen,
  onOpenChange,
  characterForm,
  customModelForm,
  showCustomModelForm,
  onCreateCharacter,
  onOpenCreateDialog,
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
}: CharacterCreationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onOpenCreateDialog} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Wand2 className="h-4 w-4 mr-2" />
          Forge New Character
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🧬 Digital Character Forge
          </DialogTitle>
          <p className="text-muted-foreground">
            Mix personality archetypes, fine-tune traits, and unleash superpowers to create your perfect AI companion.
          </p>
        </DialogHeader>

        <CharacterCreationTabs
          characterForm={characterForm}
          customModelForm={customModelForm}
          showCustomModelForm={showCustomModelForm}
          onSelectArchetype={onSelectArchetype}
          onUpdatePersonalityTrait={onUpdatePersonalityTrait}
          onGenerateSystemPrompt={onGenerateSystemPrompt}
          onToggleModelSelection={onToggleModelSelection}
          onUpdateModelSetting={onUpdateModelSetting}
          onToggleFeature={onToggleFeature}
          onAddCustomModel={onAddCustomModel}
          onSetShowCustomModelForm={onSetShowCustomModelForm}
          onUpdateCustomModelForm={onUpdateCustomModelForm}
          onUpdateCharacterForm={onUpdateCharacterForm}
          getAllAvailableModels={getAllAvailableModels}
          getModelCategory={getModelCategory}
          getSelectedModelsInfo={getSelectedModelsInfo}
          getRecommendedModels={getRecommendedModels}
        />

        <Button onClick={onCreateCharacter} className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Sparkles className="h-4 w-4 mr-2" />
          Awaken Character
        </Button>
      </DialogContent>
    </Dialog>
  )
}
