"use client"

import * as React from "react"
import { useErrorHandler } from "./error-boundary"

// Import modular components
import {
  CharacterCard,
  CharacterCreationDialog,
  CharacterEditDialog
} from "./Character-Selector/components"
import {
  personalityArchetypes,
  personalityTraits,
  modelCategories,
  featureCategories
} from "./Character-Selector/data"
import {
  generateSystemPrompt,
  selectArchetype,
  updatePersonalityTrait
} from "./Character-Selector/utils/character-utils"

// Import types
import type {
  Character,
  CharacterCapabilities,
  ModelSettings
} from "./Character-Selector/types"

// Import hooks
import { useCharacterManagement } from "./Character-Selector/hooks/use-character-management"
import { useCharacterForm } from "./Character-Selector/hooks/use-form-management"
import { useModelManagement } from "./Character-Selector/hooks/use-model-management"

// Import UI components
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Wand2, Shield } from "lucide-react"

// Import data and utilities
import { defaultCharacters } from "./Character-Selector/data/characters"
import { iconOptions } from "./Character-Selector/data/options"
import { MODEL_CONFIGS } from "@/lib/chat-service"

interface CharacterSelectorProps {
  selectedCharacter: string
  onCharacterSelect: (characterId: string) => void
}

export function CharacterSelector({ selectedCharacter, onCharacterSelect }: CharacterSelectorProps) {
  const { showError } = useErrorHandler()

  // Use custom hooks for state management
  const characterManagement = useCharacterManagement()
  const formManagement = useCharacterForm()
  const modelManagement = useModelManagement(MODEL_CONFIGS)

  const {
    characters,
    loading,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacterById
  } = characterManagement

  const {
    formData: characterForm,
    updateField: setCharacterForm,
    resetForm,
    errors: formErrors,
    isDirty
  } = formManagement

  const {
    customModels,
    addCustomModel,
    removeCustomModel,
    getModelCategories,
    loading: modelsLoading
  } = modelManagement

  // Local state for UI
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null)
  const [isAdminMode, setIsAdminMode] = React.useState(false)

  const handleCreateCustomCharacter = () => {
    if (characterForm.name && characterForm.description && characterForm.systemPrompt) {
      try {
        const newCharacter = createCharacter(characterForm)
        onCharacterSelect(newCharacter.id)
        resetForm()
        setIsCreateDialogOpen(false)
      } catch (err) {
        showError(`Failed to create character: ${err instanceof Error ? err.message : 'Unknown error'}`, 'Character Creation')
      }
    }
  }

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character)
    // Load character data into form
    Object.entries(character).forEach(([key, value]) => {
      setCharacterForm(key as keyof typeof characterForm, value)
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCharacter = () => {
    if (editingCharacter && characterForm.name && characterForm.description && characterForm.systemPrompt) {
      try {
        updateCharacter(editingCharacter.id, characterForm)
        resetForm()
        setIsEditDialogOpen(false)
        setEditingCharacter(null)
      } catch (err) {
        showError(`Failed to update character: ${err instanceof Error ? err.message : 'Unknown error'}`, 'Character Update')
      }
    }
  }

  const handleDeleteCharacter = (characterId: string) => {
    try {
      deleteCharacter(characterId)
      if (selectedCharacter === characterId) {
        onCharacterSelect("assistant") // Default to assistant if deleted character was selected
      }
    } catch (err) {
      showError(`Failed to delete character: ${err instanceof Error ? err.message : 'Unknown error'}`, 'Character Deletion')
    }
  }

  if (loading) {
    return <div>Loading characters...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Digital Character Lab
          </h2>
          <p className="text-muted-foreground mt-2">
            Craft extraordinary AI personalities through digital genetics. Mix archetypes, fine-tune traits, and unleash superpowers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isAdminMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAdminMode(!isAdminMode)}
          >
            <Shield className="h-4 w-4 mr-2" />
            {isAdminMode ? "Exit Admin" : "Admin Mode"}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Wand2 className="h-4 w-4 mr-2" />
                Forge New Character
              </Button>
            </DialogTrigger>
            <CharacterCreationDialog
              characterForm={characterForm}
              setCharacterForm={setCharacterForm}
              onCreateCharacter={handleCreateCustomCharacter}
              onSelectArchetype={selectArchetype}
              onUpdatePersonalityTrait={updatePersonalityTrait}
              onGenerateSystemPrompt={generateSystemPrompt}
              getAllAvailableModels={() => ({ ...MODEL_CONFIGS, ...customModels })}
              toggleModelSelection={(modelId) => {
                // Implementation needed
              }}
              updateModelSetting={(modelId, setting, value) => {
                // Implementation needed
              }}
              toggleFeature={(featureId) => {
                // Implementation needed
              }}
              getRecommendedModels={() => []}
              addCustomModel={addCustomModel}
              customModelForm={{ name: '', provider: '', endpoint: '', maxTokens: 2048 }}
              setCustomModelForm={() => {}}
              showCustomModelForm={false}
              setShowCustomModelForm={() => {}}
              getSelectedModelsInfo={() => []}
            />
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <CharacterEditDialog
              editingCharacter={editingCharacter}
              characterForm={characterForm}
              setCharacterForm={setCharacterForm}
              onUpdateCharacter={handleUpdateCharacter}
              onSelectArchetype={selectArchetype}
              onUpdatePersonalityTrait={updatePersonalityTrait}
              onGenerateSystemPrompt={generateSystemPrompt}
              getAllAvailableModels={() => ({ ...MODEL_CONFIGS, ...customModels })}
              toggleModelSelection={(modelId) => {
                // Implementation needed
              }}
              updateModelSetting={(modelId, setting, value) => {
                // Implementation needed
              }}
              toggleFeature={(featureId) => {
                // Implementation needed
              }}
              getRecommendedModels={() => []}
              addCustomModel={addCustomModel}
              customModelForm={{ name: '', provider: '', endpoint: '', maxTokens: 2048 }}
              setCustomModelForm={() => {}}
              showCustomModelForm={false}
              setShowCustomModelForm={() => {}}
              getSelectedModelsInfo={() => []}
            />
          </Dialog>
        </div>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            selectedCharacter={selectedCharacter}
            isAdminMode={isAdminMode}
            onCharacterSelect={onCharacterSelect}
            onEditCharacter={handleEditCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            getAllAvailableModels={() => ({ ...MODEL_CONFIGS, ...customModels })}
            getModelCategory={(modelId) => {
              if (modelId.startsWith('gpt-') || modelId.startsWith('o')) return 'openai'
              if (modelId.startsWith('claude-')) return 'anthropic'
              if (modelId.includes('groq') || modelId.includes('llama')) return 'groq'
              return 'custom'
            }}
          />
        ))}
      </div>
    </div>
  )
}
