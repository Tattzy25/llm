"use client"

import * as React from "react"
import { BookOpen, Code, Palette, Plus, User, Wrench, Edit, Trash2, Save, X, Settings, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useErrorHandler } from "@/components/error-boundary"

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
}

const defaultCharacters: Character[] = [
  {
    id: "assistant",
    name: "AI Assistant",
    description: "General-purpose AI assistant for any task",
    systemPrompt: "You are a helpful AI assistant. Provide clear, accurate, and useful responses to user queries.",
    icon: User,
    color: "bg-blue-500",
    isCustom: false
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Patient educator who explains concepts clearly",
    systemPrompt: "You are a helpful and patient teacher. Explain concepts clearly and provide examples when appropriate. Break down complex topics into understandable parts.",
    icon: BookOpen,
    color: "bg-green-500",
    isCustom: false
  },
  {
    id: "coder",
    name: "Code Expert",
    description: "Expert software developer and coding assistant",
    systemPrompt: "You are an expert software developer. Provide clean, efficient code solutions with explanations. Follow best practices and include comments in your code.",
    icon: Code,
    color: "bg-purple-500",
    isCustom: false
  },
  {
    id: "creative",
    name: "Creative Writer",
    description: "Creative writing assistant for stories and content",
    systemPrompt: "You are a creative writing assistant. Help with storytelling, poetry, and imaginative content. Be inspiring and help develop creative ideas.",
    icon: Palette,
    color: "bg-pink-500",
    isCustom: false
  }
]

const iconOptions = [
  { name: "User", component: User, value: "User" },
  { name: "BookOpen", component: BookOpen, value: "BookOpen" },
  { name: "Code", component: Code, value: "Code" },
  { name: "Palette", component: Palette, value: "Palette" },
  { name: "Wrench", component: Wrench, value: "Wrench" },
  { name: "Settings", component: Settings, value: "Settings" }
]

const colorOptions = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Gray", value: "bg-gray-500" }
]

interface CharacterSelectorProps {
  selectedCharacter: string
  onCharacterSelect: (characterId: string) => void
}

export function CharacterSelector({ selectedCharacter, onCharacterSelect }: CharacterSelectorProps) {
  const { showError } = useErrorHandler()
  const [characters, setCharacters] = React.useState<Character[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('custom-characters')
        const modifiedPresets = loadModifiedPresets()
        
        let allCharacters = [...defaultCharacters]
        
        if (saved) {
          const customChars = JSON.parse(saved)
          allCharacters = [...allCharacters, ...customChars]
        }
        
        // Merge modified presets with default characters
        modifiedPresets.forEach(modified => {
          const index = allCharacters.findIndex(char => char.id === modified.id)
          if (index !== -1) {
            allCharacters[index] = modified
          }
        })
        
        return allCharacters
      }
      return defaultCharacters
    } catch (error) {
      showError(`Failed to load saved characters: ${error instanceof Error ? error.message : 'Unknown error'}. Using default characters.`)
      return defaultCharacters
    }
  })

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null)
  const [isAdminMode, setIsAdminMode] = React.useState(false)
  const [characterForm, setCharacterForm] = React.useState({
    name: "",
    description: "",
    systemPrompt: "",
    icon: "Wrench",
    color: "bg-orange-500"
  })

  // Save characters to localStorage (both custom and modified presets)
  const saveCharacters = (chars: Character[]) => {
    try {
      // Save custom characters
      const customChars = chars.filter(char => char.isCustom)
      localStorage.setItem('custom-characters', JSON.stringify(customChars))
      
      // Save modified preset characters
      const modifiedPresets = chars.filter(char => !char.isCustom && char.updatedAt)
      localStorage.setItem('modified-presets', JSON.stringify(modifiedPresets))
    } catch (error) {
      showError(`Failed to save characters: ${error instanceof Error ? error.message : 'Storage quota exceeded or storage unavailable'}`)
    }
  }

  // Load modified presets from localStorage
  const loadModifiedPresets = (): Character[] => {
    try {
      const saved = localStorage.getItem('modified-presets')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load modified presets:', error)
    }
    return []
  }

  const handleCreateCustomCharacter = () => {
    if (characterForm.name && characterForm.description && characterForm.systemPrompt) {
      const selectedIcon = iconOptions.find(icon => icon.value === characterForm.icon)
      const newCharacter: Character = {
        id: `custom-${Date.now()}`,
        name: characterForm.name,
        description: characterForm.description,
        systemPrompt: characterForm.systemPrompt,
        icon: selectedIcon?.component || Wrench,
        color: characterForm.color,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const updatedCharacters = [...characters, newCharacter]
      setCharacters(updatedCharacters)
      saveCharacters(updatedCharacters)
      onCharacterSelect(newCharacter.id)
      resetForm()
      setIsCreateDialogOpen(false)
    }
  }

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character)
    const iconName = iconOptions.find(icon => icon.component === character.icon)?.value || "Wrench"
    setCharacterForm({
      name: character.name,
      description: character.description,
      systemPrompt: character.systemPrompt,
      icon: iconName,
      color: character.color
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCharacter = () => {
    if (editingCharacter && characterForm.name && characterForm.description && characterForm.systemPrompt) {
      const selectedIcon = iconOptions.find(icon => icon.value === characterForm.icon)
      const updatedCharacter: Character = {
        ...editingCharacter,
        name: characterForm.name,
        description: characterForm.description,
        systemPrompt: characterForm.systemPrompt,
        icon: selectedIcon?.component || Wrench,
        color: characterForm.color,
        updatedAt: new Date().toISOString()
      }
      const updatedCharacters = characters.map(char =>
        char.id === editingCharacter.id ? updatedCharacter : char
      )
      setCharacters(updatedCharacters)
      saveCharacters(updatedCharacters)
      resetForm()
      setIsEditDialogOpen(false)
      setEditingCharacter(null)
    }
  }

  const handleDeleteCharacter = (characterId: string) => {
    const updatedCharacters = characters.filter(char => char.id !== characterId)
    setCharacters(updatedCharacters)
    saveCharacters(updatedCharacters)
    if (selectedCharacter === characterId) {
      onCharacterSelect("assistant") // Default to assistant if deleted character was selected
    }
  }

  const resetForm = () => {
    setCharacterForm({
      name: "",
      description: "",
      systemPrompt: "",
      icon: "Wrench",
      color: "bg-orange-500"
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Character Management</h2>
          <p className="text-muted-foreground">Create, edit, and manage your AI characters</p>
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
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Character
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Character</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-name">Character Name</Label>
                  <Input
                    id="create-name"
                    value={characterForm.name}
                    onChange={(e) => setCharacterForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Math Tutor, Chef, Poet"
                  />
                </div>
                <div>
                  <Label htmlFor="create-icon">Icon</Label>
                  <Select value={characterForm.icon} onValueChange={(value) => setCharacterForm(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="create-description">Description</Label>
                <Input
                  id="create-description"
                  value={characterForm.description}
                  onChange={(e) => setCharacterForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this character's role"
                />
              </div>
              <div>
                <Label htmlFor="create-color">Color Theme</Label>
                <Select value={characterForm.color} onValueChange={(value) => setCharacterForm(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.value}`}></div>
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-systemPrompt">System Prompt</Label>
                <Textarea
                  id="create-systemPrompt"
                  value={characterForm.systemPrompt}
                  onChange={(e) => setCharacterForm(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="Define how this character should behave and respond"
                  rows={4}
                />
              </div>
              <Button onClick={handleCreateCustomCharacter} className="w-full">
                Create Character
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Character</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Character Name</Label>
                  <Input
                    id="edit-name"
                    value={characterForm.name}
                    onChange={(e) => setCharacterForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Math Tutor, Chef, Poet"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-icon">Icon</Label>
                  <Select value={characterForm.icon} onValueChange={(value) => setCharacterForm(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={characterForm.description}
                  onChange={(e) => setCharacterForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this character's role"
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color Theme</Label>
                <Select value={characterForm.color} onValueChange={(value) => setCharacterForm(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.value}`}></div>
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-systemPrompt">System Prompt</Label>
                <Textarea
                  id="edit-systemPrompt"
                  value={characterForm.systemPrompt}
                  onChange={(e) => setCharacterForm(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="Define how this character should behave and respond"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateCharacter} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Update Character
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character) => {
          const IconComponent = character.icon
          return (
            <Card
              key={character.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedCharacter === character.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onCharacterSelect(character.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${character.color}`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{character.name}</CardTitle>
                      <div className="flex gap-1">
                        {character.isCustom ? (
                          <Badge variant="secondary" className="text-xs">Custom</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Preset</Badge>
                        )}
                        {isAdminMode && !character.isCustom && (
                          <Badge variant="destructive" className="text-xs">Admin Edit</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {(character.isCustom || isAdminMode) && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditCharacter(character)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Character</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{character.name}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCharacter(character.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-2">
                  {character.description}
                </CardDescription>
                {character.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Updated: {new Date(character.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
