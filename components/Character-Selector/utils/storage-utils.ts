import type { Character } from "../types"

// LocalStorage keys
export const STORAGE_KEYS = {
  CHARACTERS: 'characters',
  CUSTOM_MODELS: 'custom-models',
  USER_PREFERENCES: 'user-preferences',
  CHARACTER_HISTORY: 'character-history'
} as const

// Character storage helpers
export const saveCharacters = (characters: Character[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters))
  } catch (error) {
    console.error('Failed to save characters to localStorage:', error)
  }
}

export const loadCharacters = (): Character[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHARACTERS)
    if (!stored) return []

    const characters = JSON.parse(stored)
    return Array.isArray(characters) ? characters : []
  } catch (error) {
    console.error('Failed to load characters from localStorage:', error)
    return []
  }
}

export const saveCharacter = (character: Character): void => {
  const characters = loadCharacters()
  const existingIndex = characters.findIndex(c => c.id === character.id)

  if (existingIndex >= 0) {
    characters[existingIndex] = character
  } else {
    characters.push(character)
  }

  saveCharacters(characters)
}

export const deleteCharacter = (characterId: string): void => {
  const characters = loadCharacters()
  const filtered = characters.filter(c => c.id !== characterId)
  saveCharacters(filtered)
}

export const getCharacterById = (characterId: string): Character | null => {
  const characters = loadCharacters()
  return characters.find(c => c.id === characterId) || null
}

export const updateCharacterUsage = (characterId: string): void => {
  // Note: Character interface doesn't include usage tracking properties
  // This function is a placeholder for future usage tracking implementation
  console.log(`Character ${characterId} usage updated`)
}

// Custom models storage helpers
export const saveCustomModels = (customModels: Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MODELS, JSON.stringify(customModels))
  } catch (error) {
    console.error('Failed to save custom models to localStorage:', error)
  }
}

export const loadCustomModels = (): Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_MODELS)
    if (!stored) return {}

    const models = JSON.parse(stored)
    return typeof models === 'object' && models !== null ? models : {}
  } catch (error) {
    console.error('Failed to load custom models from localStorage:', error)
    return {}
  }
}

// User preferences storage helpers
export const saveUserPreferences = (preferences: Record<string, unknown>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
  } catch (error) {
    console.error('Failed to save user preferences to localStorage:', error)
  }
}

export const loadUserPreferences = (): Record<string, unknown> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    if (!stored) return {}

    const preferences = JSON.parse(stored)
    return typeof preferences === 'object' && preferences !== null ? preferences : {}
  } catch (error) {
    console.error('Failed to load user preferences from localStorage:', error)
    return {}
  }
}

// Character history storage helpers
export const saveCharacterHistory = (history: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHARACTER_HISTORY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save character history to localStorage:', error)
  }
}

export const loadCharacterHistory = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHARACTER_HISTORY)
    if (!stored) return []

    const history = JSON.parse(stored)
    return Array.isArray(history) ? history : []
  } catch (error) {
    console.error('Failed to load character history from localStorage:', error)
    return []
  }
}

export const addToCharacterHistory = (characterId: string): void => {
  const history = loadCharacterHistory()
  const filtered = history.filter(id => id !== characterId)
  filtered.unshift(characterId)

  // Keep only the last 10 characters in history
  const trimmed = filtered.slice(0, 10)
  saveCharacterHistory(trimmed)
}

// Utility functions
export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

export const exportData = (): string => {
  const data = {
    characters: loadCharacters(),
    customModels: loadCustomModels(),
    userPreferences: loadUserPreferences(),
    characterHistory: loadCharacterHistory(),
    exportDate: new Date().toISOString()
  }

  return JSON.stringify(data, null, 2)
}

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData)

    if (data.characters) saveCharacters(data.characters)
    if (data.customModels) saveCustomModels(data.customModels)
    if (data.userPreferences) saveUserPreferences(data.userPreferences)
    if (data.characterHistory) saveCharacterHistory(data.characterHistory)

    return true
  } catch (error) {
    console.error('Failed to import data:', error)
    return false
  }
}

// Storage quota helpers
export const getStorageUsage = (): { used: number; available: number } => {
  let used = 0
  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key)
    if (item) {
      used += item.length
    }
  })

  // Estimate available space (localStorage typically has 5-10MB limit)
  const available = 5 * 1024 * 1024 - used // 5MB estimate

  return { used, available }
}

export const isStorageNearLimit = (): boolean => {
  const { used, available } = getStorageUsage()
  return used > available * 0.8 // 80% usage threshold
}
