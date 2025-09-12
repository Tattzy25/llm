"use client"

import * as React from "react"
import { useErrorHandler } from "./error-boundary"

// Import modular components
import {
  CharacterCard
} from "./Character-Selector/components"
import { CharacterCreationDialog } from "./Character-Selector/components/CharacterCreationDialog"
import { CharacterEditDialog } from "./Character-Selector/components/CharacterEditDialog"
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

// Import UI components
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Wand2, Shield } from "lucide-react"

// Import data and utilities
import { defaultCharacters } from "./Character-Selector/data/characters"
import { iconOptions } from "./Character-Selector/data/options"
import { MODEL_CONFIGS } from "@/lib/chat-service"

interface CharacterSelectorLegacyProps {
  selectedCharacter: string
  onCharacterSelect: (characterId: string) => void
}

export function CharacterSelectorLegacy({ selectedCharacter, onCharacterSelect }: CharacterSelectorLegacyProps) {
  const { showError } = useErrorHandler()
  
  // Legacy state management - directly using defaultCharacters without hooks
  const [characters, setCharacters] = React.useState<Character[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('custom-characters')
        
        let allCharacters = [...defaultCharacters]
        
        if (saved) {
          const customChars = JSON.parse(saved)
          allCharacters = [...allCharacters, ...customChars]
        }
        
        return allCharacters
      }
      return defaultCharacters
    } catch (error) {
      showError(`Failed to load saved characters: ${error instanceof Error ? error.message : 'Unknown error'}. Using default characters.`, 'Character Storage')
      return defaultCharacters
    }
  })

  // Local state for UI
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null)
  const [isAdminMode, setIsAdminMode] = React.useState(false)
  const [characterForm, setCharacterForm] = React.useState({
    name: "",
    description: "",
    systemPrompt: "",
    icon: "Wrench",
    color: "bg-orange-500",
    capabilities: {
      voice: false,
      imageGeneration: false,
      imageAnalysis: false,
      fileProcessing: false,
      deepResearch: false,
      codeExecution: false,
      apiCalling: false,
      webBrowsing: false
    } as CharacterCapabilities,
    selectedModels: [] as string[],
    modelSettings: {} as Record<string, ModelSettings>,
    preferredFeatures: [] as string[],
    personality: {
      creativity: 50,
      analytical: 50,
      empathy: 50,
      humor: 50,
      formality: 50,
      curiosity: 50,
      patience: 50,
      assertiveness: 50
    },
    archetype: "",
    visualTheme: ""
  })

  const handleCreateCustomCharacter = () => {
    if (characterForm.name && characterForm.description && characterForm.systemPrompt) {
      try {
        const newCharacter: Character = {
          id: Date.now().toString(),
          name: characterForm.name,
          description: characterForm.description,
          systemPrompt: characterForm.systemPrompt,
          icon: () => null,
          color: characterForm.color,
          isCustom: true
        }
        const updatedCharacters = [...characters, newCharacter]
        setCharacters(updatedCharacters)
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
    setCharacterForm({
      name: character.name,
      description: character.description,
      systemPrompt: character.systemPrompt,
      icon: "Wrench",
      color: character.color,
      capabilities: {
        voice: false,
        imageGeneration: false,
        imageAnalysis: false,
        fileProcessing: false,
        deepResearch: false,
        codeExecution: false,
        apiCalling: false,
        webBrowsing: false
      },
      selectedModels: [],
      modelSettings: {},
      preferredFeatures: [],
      personality: {
        creativity: 50,
        analytical: 50,
        empathy: 50,
        humor: 50,
        formality: 50,
        curiosity: 50,
        patience: 50,
        assertiveness: 50
      },
      archetype: "",
      visualTheme: ""
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCharacter = () => {
    if (editingCharacter && characterForm.name && characterForm.description && characterForm.systemPrompt) {
      try {
        const updatedCharacter: Character = {
          ...editingCharacter,
          name: characterForm.name,
          description: characterForm.description,
          systemPrompt: characterForm.systemPrompt,
          color: characterForm.color
        }
        const updatedCharacters = characters.map(char =>
          char.id === editingCharacter.id ? updatedCharacter : char
        )
        setCharacters(updatedCharacters)
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
      const updatedCharacters = characters.filter(char => char.id !== characterId)
      setCharacters(updatedCharacters)
      if (selectedCharacter === characterId) {
        onCharacterSelect("assistant") // Default to assistant if deleted character was selected
      }
    } catch (err) {
      showError(`Failed to delete character: ${err instanceof Error ? err.message : 'Unknown error'}`, 'Character Deletion')
    }
  }

  const resetForm = () => {
    setCharacterForm({
      name: "",
      description: "",
      systemPrompt: "",
      icon: "Wrench",
      color: "bg-orange-500",
      capabilities: {
        voice: false,
        imageGeneration: false,
        imageAnalysis: false,
        fileProcessing: false,
        deepResearch: false,
        codeExecution: false,
        apiCalling: false,
        webBrowsing: false
      },
      selectedModels: [],
      modelSettings: {},
      preferredFeatures: [],
      personality: {
        creativity: 50,
        analytical: 50,
        empathy: 50,
        humor: 50,
        formality: 50,
        curiosity: 50,
        patience: 50,
        assertiveness: 50
      },
      archetype: "",
      visualTheme: ""
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Legacy Character Lab
          </h2>
          <p className="text-muted-foreground mt-2">
            This is the legacy version without hooks - uses direct state management and defaultCharacters import.
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
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Wand2 className="h-4 w-4 mr-2" />
                Forge New Character (Legacy)
              </Button>
            </DialogTrigger>
            <CharacterCreationDialog
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onCreateCharacter={handleCreateCustomCharacter}
              characterForm={characterForm}
              setCharacterForm={setCharacterForm}
              personalityArchetypes={personalityArchetypes}
              personalityTraits={personalityTraits}
              modelCategories={modelCategories}
              featureCategories={featureCategories}
              iconOptions={iconOptions}
              getAllAvailableModels={() => MODEL_CONFIGS}
              getModelCategory={(modelId) => {
                if (modelId.startsWith('gpt-') || modelId.startsWith('o')) return 'openai'
                if (modelId.startsWith('claude-')) return 'anthropic'
                if (modelId.includes('groq') || modelId.includes('llama')) return 'groq'
                return 'custom'
              }}
              generateSystemPrompt={generateSystemPrompt}
              selectArchetype={selectArchetype}
              updatePersonalityTrait={updatePersonalityTrait}
            />
          </Dialog>

          {editingCharacter && (
            <CharacterEditDialog
              character={editingCharacter}
              isOpen={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              onSave={handleUpdateCharacter}
            />
          )}
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
            getAllAvailableModels={() => MODEL_CONFIGS}
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