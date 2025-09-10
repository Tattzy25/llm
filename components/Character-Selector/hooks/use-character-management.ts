import { useState, useEffect, useCallback } from 'react'
import type { Character, CharacterFormData } from '../types'
import { loadCharacters, saveCharacter, deleteCharacter as deleteCharacterFromStorage } from '../utils/storage-utils'

export const useCharacterManagement = () => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load characters on mount
  useEffect(() => {
    try {
      const loadedCharacters = loadCharacters()
      setCharacters(loadedCharacters)
    } catch (err) {
      setError('Failed to load characters')
      console.error('Error loading characters:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createCharacter = useCallback((characterData: CharacterFormData) => {
    try {
      const newCharacter: Character = {
        id: `char-${Date.now()}`,
        name: characterData.name,
        description: characterData.description,
        systemPrompt: characterData.systemPrompt,
        icon: characterData.icon as unknown as React.ComponentType<{ className?: string }>, // This will need proper icon handling
        color: characterData.color,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        capabilities: characterData.capabilities,
        models: characterData.selectedModels,
        modelSettings: characterData.modelSettings,
        preferredFeatures: characterData.preferredFeatures,
        personality: characterData.personality,
        archetype: characterData.archetype,
        visualTheme: characterData.visualTheme
      }

      saveCharacter(newCharacter)
      setCharacters(prev => [...prev, newCharacter])
      return newCharacter
    } catch (err) {
      setError('Failed to create character')
      console.error('Error creating character:', err)
      throw err
    }
  }, [])

  const updateCharacter = useCallback((characterId: string, characterData: CharacterFormData) => {
    try {
      const existingCharacter = characters.find(c => c.id === characterId)
      if (!existingCharacter) {
        throw new Error('Character not found')
      }

      const updatedCharacter: Character = {
        ...existingCharacter,
        name: characterData.name,
        description: characterData.description,
        systemPrompt: characterData.systemPrompt,
        color: characterData.color,
        updatedAt: new Date().toISOString(),
        capabilities: characterData.capabilities,
        models: characterData.selectedModels,
        modelSettings: characterData.modelSettings,
        preferredFeatures: characterData.preferredFeatures,
        personality: characterData.personality,
        archetype: characterData.archetype,
        visualTheme: characterData.visualTheme
      }

      saveCharacter(updatedCharacter)
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c))
      return updatedCharacter
    } catch (err) {
      setError('Failed to update character')
      console.error('Error updating character:', err)
      throw err
    }
  }, [characters])

  const deleteCharacter = useCallback((characterId: string) => {
    try {
      deleteCharacterFromStorage(characterId)
      setCharacters(prev => prev.filter(c => c.id !== characterId))
    } catch (err) {
      setError('Failed to delete character')
      console.error('Error deleting character:', err)
      throw err
    }
  }, [])

  const getCharacterById = useCallback((characterId: string) => {
    return characters.find(c => c.id === characterId) || null
  }, [characters])

  const duplicateCharacter = useCallback((characterId: string) => {
    try {
      const originalCharacter = getCharacterById(characterId)
      if (!originalCharacter) {
        throw new Error('Character not found')
      }

      const duplicatedCharacter: Character = {
        ...originalCharacter,
        id: `char-${Date.now()}`,
        name: `${originalCharacter.name} (Copy)`,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      saveCharacter(duplicatedCharacter)
      setCharacters(prev => [...prev, duplicatedCharacter])
      return duplicatedCharacter
    } catch (err) {
      setError('Failed to duplicate character')
      console.error('Error duplicating character:', err)
      throw err
    }
  }, [getCharacterById])

  return {
    characters,
    loading,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacterById,
    duplicateCharacter,
    clearError: () => setError(null)
  }
}
