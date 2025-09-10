import { useState, useCallback } from 'react'
import type { CharacterFormData, CustomModelFormData } from '../types'
import { createEmptyCharacterForm, validateCharacterForm, validateCustomModelForm } from '../utils/form-utils'

export const useCharacterForm = (initialData?: Partial<CharacterFormData>) => {
  const [formData, setFormData] = useState<CharacterFormData>(() => ({
    ...createEmptyCharacterForm(),
    ...initialData
  }))
  const [errors, setErrors] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [originalData, setOriginalData] = useState<CharacterFormData>(formData)

  const updateField = useCallback(<T extends keyof CharacterFormData>(
    field: T,
    value: CharacterFormData[T]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  const updateNestedField = useCallback((path: string[], value: unknown) => {
    setFormData(prev => {
      const newData = { ...prev }
      let current: Record<string, unknown> = newData

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
      return newData
    })
    setIsDirty(true)
  }, [])

  const validate = useCallback(() => {
    const validationErrors = validateCharacterForm(formData)
    setErrors(validationErrors)
    return validationErrors.length === 0
  }, [formData])

  const reset = useCallback(() => {
    setFormData(createEmptyCharacterForm())
    setErrors([])
    setIsDirty(false)
    setOriginalData(createEmptyCharacterForm())
  }, [])

  const loadCharacter = useCallback((characterData: CharacterFormData) => {
    setFormData(characterData)
    setOriginalData(characterData)
    setErrors([])
    setIsDirty(false)
  }, [])

  const saveAsOriginal = useCallback(() => {
    setOriginalData(formData)
    setIsDirty(false)
  }, [formData])

  return {
    formData,
    errors,
    isDirty,
    updateField,
    updateNestedField,
    validate,
    reset,
    loadCharacter,
    saveAsOriginal,
    hasErrors: errors.length > 0
  }
}

export const useCustomModelForm = () => {
  const [formData, setFormData] = useState<CustomModelFormData>({
    name: '',
    provider: '',
    endpoint: '',
    maxTokens: 2048
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = useCallback(<T extends keyof CustomModelFormData>(
    field: T,
    value: CustomModelFormData[T]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const validate = useCallback(() => {
    const validationErrors = validateCustomModelForm(formData)
    setErrors(validationErrors)
    return validationErrors.length === 0
  }, [formData])

  const reset = useCallback(() => {
    setFormData({
      name: '',
      provider: '',
      endpoint: '',
      maxTokens: 2048
    })
    setErrors([])
  }, [])

  const submit = useCallback(async (onSubmit: (data: CustomModelFormData) => Promise<void>) => {
    if (!validate()) return false

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      reset()
      return true
    } catch (error) {
      console.error('Failed to submit custom model:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validate, reset])

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    validate,
    reset,
    submit,
    hasErrors: errors.length > 0
  }
}
