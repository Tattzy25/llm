import type { Character, CharacterFormData } from "../types"
import { Wrench } from "lucide-react"

// Form validation helpers
export const validateCharacterForm = (form: CharacterFormData): string[] => {
  const errors: string[] = []

  if (!form.name.trim()) {
    errors.push("Character name is required")
  }

  if (!form.description.trim()) {
    errors.push("Character description is required")
  }

  if (!form.systemPrompt.trim()) {
    errors.push("System prompt is required")
  }

  if (form.selectedModels.length === 0) {
    errors.push("At least one model must be selected")
  }

  // Validate personality traits are within bounds
  Object.entries(form.personality).forEach(([trait, value]) => {
    if (value < 0 || value > 100) {
      errors.push(`${trait} must be between 0 and 100`)
    }
  })

  return errors
}

export const validateCustomModelForm = (form: { name: string; provider: string; endpoint: string; maxTokens: number }): string[] => {
  const errors: string[] = []

  if (!form.name.trim()) {
    errors.push("Model name is required")
  }

  if (!form.provider.trim()) {
    errors.push("Provider is required")
  }

  if (form.maxTokens <= 0) {
    errors.push("Max tokens must be greater than 0")
  }

  if (form.endpoint && !form.endpoint.startsWith('http')) {
    errors.push("Endpoint must be a valid URL")
  }

  return errors
}

// Form initialization helpers
export const createEmptyCharacterForm = (): CharacterFormData => ({
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
    riskTolerance: 50
  },
  archetype: "",
  visualTheme: "default"
})

export const createCharacterFormFromCharacter = (character: Character): CharacterFormData => ({
  name: character.name,
  description: character.description,
  systemPrompt: character.systemPrompt,
  icon: "Wrench", // Default icon since Character.icon is a React component
  color: character.color,
  capabilities: character.capabilities || {
    voice: false,
    imageGeneration: false,
    imageAnalysis: false,
    fileProcessing: false,
    deepResearch: false,
    codeExecution: false,
    apiCalling: false,
    webBrowsing: false
  },
  selectedModels: character.models || [],
  modelSettings: character.modelSettings || {},
  preferredFeatures: character.preferredFeatures || [],
  personality: character.personality || {
    creativity: 50,
    analytical: 50,
    empathy: 50,
    humor: 50,
    formality: 50,
    riskTolerance: 50
  },
  archetype: character.archetype || "",
  visualTheme: character.visualTheme || "default"
})

// Form state management helpers
export const updateFormField = <T extends keyof CharacterFormData>(
  form: CharacterFormData,
  setForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void,
  field: T,
  value: CharacterFormData[T]
) => {
  setForm(prev => ({ ...prev, [field]: value }))
}

export const updateNestedFormField = (
  form: CharacterFormData,
  setForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void,
  path: string[],
  value: unknown
) => {
  setForm(prev => {
    const newForm = { ...prev }
    let current: Record<string, unknown> = newForm

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]
      if (typeof current[key] === 'object' && current[key] !== null) {
        current[key] = { ...current[key] as Record<string, unknown> }
      } else {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    current[path[path.length - 1]] = value
    return newForm
  })
}

export const resetForm = (
  setForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void
) => {
  setForm(createEmptyCharacterForm())
}

export const isFormDirty = (
  originalForm: CharacterFormData,
  currentForm: CharacterFormData
): boolean => {
  return JSON.stringify(originalForm) !== JSON.stringify(currentForm)
}

// Form submission helpers
export const prepareCharacterForSave = (form: CharacterFormData): Character => ({
  id: `char-${Date.now()}`,
  name: form.name.trim(),
  description: form.description.trim(),
  systemPrompt: form.systemPrompt.trim(),
  icon: Wrench as React.ComponentType<{ className?: string }>, // Default icon component
  color: form.color,
  isCustom: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  capabilities: form.capabilities,
  models: [...form.selectedModels],
  modelSettings: { ...form.modelSettings },
  preferredFeatures: [...form.preferredFeatures],
  personality: { ...form.personality },
  archetype: form.archetype,
  visualTheme: form.visualTheme
})

export const prepareCharacterForUpdate = (
  existingCharacter: Character,
  form: CharacterFormData
): Character => ({
  ...existingCharacter,
  name: form.name.trim(),
  description: form.description.trim(),
  systemPrompt: form.systemPrompt.trim(),
  icon: Wrench as React.ComponentType<{ className?: string }>, // Default icon component
  color: form.color,
  capabilities: form.capabilities,
  models: [...form.selectedModels],
  modelSettings: { ...form.modelSettings },
  preferredFeatures: [...form.preferredFeatures],
  personality: { ...form.personality },
  archetype: form.archetype,
  visualTheme: form.visualTheme,
  updatedAt: new Date().toISOString()
})
