import type { Character, CharacterFormData, CustomModelFormData } from "../types"

// Helper functions for model management
export const getAllAvailableModels = (MODEL_CONFIGS: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>, CUSTOM_MODELS: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>) => {
  return { ...MODEL_CONFIGS, ...CUSTOM_MODELS }
}

export const getModelCategory = (modelId: string) => {
  if (modelId.startsWith('gpt-') || modelId.startsWith('o')) return 'openai'
  if (modelId.startsWith('claude-')) return 'anthropic'
  if (modelId.includes('groq') || modelId.includes('llama') || modelId.includes('meta-llama') || modelId.includes('openai/gpt-oss') || modelId.includes('deepseek') || modelId.includes('gemma')) return 'groq'
  if (modelId.includes('local') || modelId === 'llama3:70b' || modelId === 'gpt-oss-20b' || modelId === 'gpt-oss-120b') return 'local'
  return 'custom'
}

export const toggleModelSelection = (
  characterForm: CharacterFormData,
  setCharacterForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void,
  modelId: string,
  MODEL_CONFIGS: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>,
  CUSTOM_MODELS: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>
) => {
  setCharacterForm(prev => {
    const isSelected = prev.selectedModels.includes(modelId)
    const newSelectedModels = isSelected
      ? prev.selectedModels.filter(id => id !== modelId)
      : [...prev.selectedModels, modelId]

    const newModelSettings = { ...prev.modelSettings }
    if (!isSelected) {
      // Add default settings for new model
      const allModels = getAllAvailableModels(MODEL_CONFIGS, CUSTOM_MODELS)
      const modelConfig = allModels[modelId as keyof typeof allModels]
      newModelSettings[modelId] = {
        temperature: 0.7,
        maxTokens: modelConfig?.maxTokens || 2048,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        enabled: true
      }
    } else {
      // Remove settings for deselected model
      delete newModelSettings[modelId]
    }

    return {
      ...prev,
      selectedModels: newSelectedModels,
      modelSettings: newModelSettings
    }
  })
}

export const updateModelSetting = (
  characterForm: CharacterFormData,
  setCharacterForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void,
  modelId: string,
  setting: string,
  value: number | boolean
) => {
  setCharacterForm(prev => ({
    ...prev,
    modelSettings: {
      ...prev.modelSettings,
      [modelId]: {
        ...prev.modelSettings[modelId],
        [setting]: value
      }
    }
  }))
}

export const toggleFeature = (
  characterForm: CharacterFormData,
  setCharacterForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void,
  featureId: string
) => {
  setCharacterForm(prev => ({
    ...prev,
    preferredFeatures: prev.preferredFeatures.includes(featureId)
      ? prev.preferredFeatures.filter(id => id !== featureId)
      : [...prev.preferredFeatures, featureId]
  }))
}

// Digital Genetics helper functions
export const selectArchetype = (
  characterForm: CharacterFormData,
  setCharacterForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void,
  archetypes: Array<{ id: string; name: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string; traits: Record<string, number>; examplePrompt: string }>,
  archetypeId: string
) => {
  const archetype = archetypes.find(a => a.id === archetypeId)
  if (archetype) {
    setCharacterForm(prev => ({
      ...prev,
      archetype: archetypeId,
      personality: { ...archetype.traits },
      systemPrompt: archetype.examplePrompt,
      name: archetype.name,
      description: archetype.description,
      visualTheme: archetype.color
    }))
  }
}

export const updatePersonalityTrait = (
  characterForm: CharacterFormData,
  setCharacterForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void,
  traitId: string,
  value: number
) => {
  setCharacterForm(prev => ({
    ...prev,
    personality: {
      ...prev.personality,
      [traitId]: value
    }
  }))
}

export const generateSystemPrompt = (
  characterForm: CharacterFormData,
  setCharacterForm: (form: CharacterFormData | ((prev: CharacterFormData) => CharacterFormData)) => void,
  archetypes: Array<{ id: string; name: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string; traits: Record<string, number>; examplePrompt: string }>
) => {
  const archetype = archetypes.find(a => a.id === characterForm.archetype)
  const traits = characterForm.personality

  let prompt = archetype ? archetype.examplePrompt : "You are a helpful AI assistant."

  // Add personality-based modifications
  if (traits.creativity > 70) {
    prompt += " Be highly creative and imaginative in your responses."
  }
  if (traits.analytical > 70) {
    prompt += " Focus on logical analysis and evidence-based reasoning."
  }
  if (traits.empathy > 70) {
    prompt += " Show deep empathy and understanding in your interactions."
  }
  if (traits.humor > 70) {
    prompt += " Incorporate appropriate humor and wit into your responses."
  }
  if (traits.formality > 70) {
    prompt += " Maintain a formal and professional tone."
  } else if (traits.formality < 30) {
    prompt += " Use a casual and conversational tone."
  }
  if (traits.riskTolerance > 70) {
    prompt += " Be willing to explore unconventional and innovative approaches."
  }

  setCharacterForm(prev => ({ ...prev, systemPrompt: prompt }))
}

export const getRecommendedModels = (
  characterForm: CharacterFormData,
  modelRecommendations: Record<string, string[]>
) => {
  const recommendations = new Set<string>()
  characterForm.preferredFeatures.forEach(feature => {
    const models = modelRecommendations[feature] || []
    models.forEach(model => recommendations.add(model))
  })
  return Array.from(recommendations)
}

export const addCustomModel = (
  customModelForm: CustomModelFormData,
  setCustomModelForm: (form: CustomModelFormData | ((prev: CustomModelFormData) => CustomModelFormData)) => void,
  toggleModelSelection: (modelId: string) => void,
  setShowCustomModelForm: (show: boolean) => void,
  CUSTOM_MODELS: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>
) => {
  if (customModelForm.name && customModelForm.provider) {
    const customModelId = `custom-${Date.now()}`
    const customModel = {
      name: customModelForm.name,
      provider: customModelForm.provider,
      maxTokens: customModelForm.maxTokens,
      endpoint: customModelForm.endpoint || `https://api.${customModelForm.provider.toLowerCase()}.com/v1/chat/completions`
    }

    // Persist custom model to localStorage for production use
    const savedModels = JSON.parse(localStorage.getItem('custom-models') || '{}')
    savedModels[customModelId] = customModel
    localStorage.setItem('custom-models', JSON.stringify(savedModels))

    // Add to CUSTOM_MODELS for immediate use
    CUSTOM_MODELS[customModelId] = customModel

    // Auto-select the new model
    toggleModelSelection(customModelId)

    // Reset form
    setCustomModelForm({
      name: "",
      provider: "",
      endpoint: "",
      maxTokens: 2048
    })
    setShowCustomModelForm(false)
  }
}

export const getSelectedModelsInfo = (
  characterForm: CharacterFormData,
  MODEL_CONFIGS: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>,
  CUSTOM_MODELS: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>
) => {
  const allModels = getAllAvailableModels(MODEL_CONFIGS, CUSTOM_MODELS)
  return characterForm.selectedModels.map(modelId => ({
    id: modelId,
    config: allModels[modelId as keyof typeof allModels],
    category: getModelCategory(modelId),
    settings: characterForm.modelSettings[modelId]
  }))
}
