// Character-related type definitions
export interface CharacterEvolution {
  level: number
  experience: number
  achievements: string[]
  specialization: string[]
  interactionCount: number
}

export interface CharacterCapabilities {
  voice?: boolean // STT/TTS capabilities
  imageGeneration?: boolean // Can create/generate images
  imageAnalysis?: boolean // Can analyze images (vision models)
  fileProcessing?: boolean // Can process documents/files
  deepResearch?: boolean // Enhanced research capabilities
  codeExecution?: boolean // Can execute/run code
  apiCalling?: boolean // Can make external API calls
  webBrowsing?: boolean // Can browse the web
}

export interface ModelSettings {
  temperature: number
  maxTokens: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  enabled: boolean
}

// Enhanced Character Interface with Personality
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
  // Enhanced capability and model fields
  capabilities?: CharacterCapabilities
  models?: string[] // Array of model IDs
  modelSettings?: Record<string, ModelSettings> // Model-specific settings
  preferredFeatures?: string[] // Preferred use cases/features
  // Digital Genetics fields
  personality?: Record<string, number> // Personality trait values (0-100)
  archetype?: string // Selected personality archetype
  visualTheme?: string // Dynamic visual theme
  evolution?: CharacterEvolution // Character progression data
}

export interface CharacterSelectorProps {
  selectedCharacter: string
  onCharacterSelect: (characterId: string) => void
}

export interface PersonalityArchetype {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  traits: Record<string, number>
  examplePrompt: string
}

export interface PersonalityTrait {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export interface ModelCategory {
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export interface FeatureDefinition {
  name: string
  description: string
}

export interface AvailableModel {
  id: string
  name: string
  provider: string
  capabilities: string[]
}

export interface CharacterFormData {
  name: string
  description: string
  systemPrompt: string
  icon: string
  color: string
  capabilities: CharacterCapabilities
  selectedModels: string[]
  modelSettings: Record<string, ModelSettings>
  preferredFeatures: string[]
  personality: Record<string, number>
  archetype: string
  visualTheme: string
}

export interface CustomModelFormData {
  name: string
  provider: string
  endpoint: string
  maxTokens: number
}
