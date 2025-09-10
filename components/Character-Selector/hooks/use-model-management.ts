import { useState, useEffect, useCallback } from 'react'
import { loadCustomModels, saveCustomModels } from '../utils/storage-utils'

export const useModelManagement = (MODEL_CONFIGS: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>) => {
  const [customModels, setCustomModels] = useState<Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>>({})
  const [loading, setLoading] = useState(true)

  // Load custom models on mount
  useEffect(() => {
    try {
      const loadedModels = loadCustomModels()
      setCustomModels(loadedModels)
    } catch (error) {
      console.error('Failed to load custom models:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const addCustomModel = useCallback((modelData: {
    name: string
    provider: string
    endpoint?: string
    maxTokens: number
  }) => {
    const modelId = `custom-${Date.now()}`
    const newModel = {
      name: modelData.name,
      provider: modelData.provider,
      maxTokens: modelData.maxTokens,
      endpoint: modelData.endpoint || `https://api.${modelData.provider.toLowerCase()}.com/v1/chat/completions`
    }

    const updatedModels = { ...customModels, [modelId]: newModel }
    setCustomModels(updatedModels)
    saveCustomModels(updatedModels)

    return modelId
  }, [customModels])

  const removeCustomModel = useCallback((modelId: string) => {
    const updatedModels = { ...customModels }
    delete updatedModels[modelId]
    setCustomModels(updatedModels)
    saveCustomModels(updatedModels)
  }, [customModels])

  const updateCustomModel = useCallback((modelId: string, updates: Partial<{ name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>) => {
    const updatedModels = {
      ...customModels,
      [modelId]: { ...customModels[modelId], ...updates }
    }
    setCustomModels(updatedModels)
    saveCustomModels(updatedModels)
  }, [customModels])

  const getAllModels = useCallback(() => {
    return { ...MODEL_CONFIGS, ...customModels }
  }, [MODEL_CONFIGS, customModels])

  const getModelById = useCallback((modelId: string) => {
    const allModels = getAllModels()
    return allModels[modelId] || null
  }, [getAllModels])

  const getModelsByProvider = useCallback((provider: string) => {
    const allModels = getAllModels()
    return Object.entries(allModels)
      .filter(([_, model]: [string, { name: string; maxTokens: number; endpoint: string; provider?: string; [key: string]: unknown }]) => model.provider === provider)
      .map(([id, model]) => ({ id, ...model }))
  }, [getAllModels])

  const getModelCategories = useCallback(() => {
    const allModels = getAllModels()
    const categories: Record<string, Array<{ id: string; name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>> = {}

    Object.entries(allModels).forEach(([id, model]: [string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }]) => {
      const category = getModelCategory(id)
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push({ id, ...model })
    })

    return categories
  }, [getAllModels])

  return {
    customModels,
    loading,
    addCustomModel,
    removeCustomModel,
    updateCustomModel,
    getAllModels,
    getModelById,
    getModelsByProvider,
    getModelCategories
  }
}

// Helper function to determine model category
const getModelCategory = (modelId: string): string => {
  if (modelId.startsWith('gpt-') || modelId.startsWith('o')) return 'openai'
  if (modelId.startsWith('claude-')) return 'anthropic'
  if (modelId.includes('groq') || modelId.includes('llama') || modelId.includes('meta-llama') || modelId.includes('openai/gpt-oss') || modelId.includes('deepseek') || modelId.includes('gemma')) return 'groq'
  if (modelId.includes('local') || modelId === 'llama3:70b' || modelId === 'gpt-oss-20b' || modelId === 'gpt-oss-120b') return 'local'
  return 'custom'
}
