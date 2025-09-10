import { Character } from "@/components/Character-Selector/types"

export const getCharacters = (): Character[] => {
  if (typeof window === 'undefined') {
    throw new Error('Character utilities cannot be used on the server side. This should only be called in browser context.')
  }

  try {
    const saved = localStorage.getItem('custom-characters')
    const defaultCharacters: Character[] = [
      {
        id: "assistant",
        name: "AI Assistant",
        description: "General-purpose AI assistant for any task",
        systemPrompt: "You are a helpful AI assistant. Provide clear, accurate, and useful responses to user queries.",
        icon: () => null,
        color: "bg-blue-500",
        isCustom: false
      },
      {
        id: "teacher",
        name: "Teacher",
        description: "Patient educator who explains concepts clearly",
        systemPrompt: "You are a helpful and patient teacher. Explain concepts clearly and provide examples when appropriate. Break down complex topics into understandable parts.",
        icon: () => null,
        color: "bg-green-500",
        isCustom: false
      },
      {
        id: "coder",
        name: "Code Expert",
        description: "Expert software developer and coding assistant",
        systemPrompt: "You are an expert software developer. Provide clean, efficient code solutions with explanations. Follow best practices and include comments in your code.",
        icon: () => null,
        color: "bg-purple-500",
        isCustom: false
      },
      {
        id: "creative",
        name: "Creative Writer",
        description: "Creative writing assistant for stories and content",
        systemPrompt: "You are a creative writing assistant. Help with storytelling, poetry, and imaginative content. Be inspiring and help develop creative ideas.",
        icon: () => null,
        color: "bg-pink-500",
        isCustom: false
      }
    ]

    if (saved) {
      try {
        const customChars = JSON.parse(saved)
        if (!Array.isArray(customChars)) {
          throw new Error('Invalid character data format in localStorage')
        }
        return [...defaultCharacters, ...customChars]
      } catch (parseError) {
        console.error('Failed to parse custom characters from localStorage:', parseError)
        throw new Error('Corrupted character data in localStorage. Please clear your browser data and try again.')
      }
    }

    return defaultCharacters
  } catch (error) {
    console.error('Failed to load characters:', error)
    throw new Error('Unable to load characters. Please check your browser settings and try again.')
  }
}

export const getCharacterById = (id: string): Character | undefined => {
  const characters = getCharacters()
  return characters.find(char => char.id === id)
}
