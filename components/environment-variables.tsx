"use client"

import * as React from "react"
import { Settings, Plus, Copy, Trash2, Eye, EyeOff, Upload, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useNotifications } from "@/components/notification-system"

interface EnvironmentVariable {
  id: string
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

export function EnvironmentVariables() {
  const { showSuccess, showError, showWarning } = useNotifications()
  const [envVars, setEnvVars] = React.useState<EnvironmentVariable[]>([
    {
      id: "1",
      key: "OPENAI_API_KEY",
      value: "sk-1234567890abcdef1234567890abcdef",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: "2", 
      key: "ANTHROPIC_API_KEY",
      value: "sk-ant-1234567890abcdef1234567890abcdef",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ])
  
  const [newKey, setNewKey] = React.useState("")
  const [newValue, setNewValue] = React.useState("")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editKey, setEditKey] = React.useState("")
  const [editValue, setEditValue] = React.useState("")
  const [isSensitive, setIsSensitive] = React.useState(true)
  const [visibleValues, setVisibleValues] = React.useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredEnvVars = envVars.filter(envVar => 
    envVar.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    envVar.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddVariable = () => {
    if (!newKey.trim() || !newValue.trim()) {
      showError('Please enter both key and value', 'Missing required fields')
      return
    }

    if (envVars.some(v => v.key === newKey.trim())) {
      showError('Key already exists', 'Please choose a different name')
      return
    }

    const newVar: EnvironmentVariable = {
      id: Date.now().toString(),
      key: newKey.trim(),
      value: newValue.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setEnvVars(prev => [...prev, newVar])
    setNewKey("")
    setNewValue("")
    showSuccess('Environment variable added successfully', `"${newVar.key}" is now available`)
  }

  const handleEditVariable = (id: string) => {
    const envVar = envVars.find(v => v.id === id)
    if (envVar) {
      setEditingId(id)
      setEditKey(envVar.key)
      setEditValue(envVar.value)
    }
  }

  const handleSaveEdit = () => {
    if (!editKey.trim() || !editValue.trim()) {
      showError('Please enter both key and value', 'Missing required fields')
      return
    }

    setEnvVars(prev => prev.map(v => 
      v.id === editingId 
        ? { ...v, key: editKey.trim(), value: editValue.trim(), updatedAt: new Date() }
        : v
    ))
    
    setEditingId(null)
    setEditKey("")
    setEditValue("")
    showSuccess('Environment variable updated successfully', 'Changes saved')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditKey("")
    setEditValue("")
  }

  const handleDeleteVariable = (id: string) => {
    const varToDelete = envVars.find(v => v.id === id)
    setEnvVars(prev => prev.filter(v => v.id !== id))
    showSuccess('Environment variable deleted successfully', varToDelete ? `"${varToDelete.key}" has been removed` : 'Variable removed')
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    showSuccess(`${type} copied to clipboard`, 'Ready to paste')
    
    // Auto-hide after copying
    setTimeout(() => {
      setVisibleValues(prev => {
        const newSet = new Set(prev)
        const envVar = envVars.find(v => v.key === text || v.value === text)
        if (envVar) newSet.delete(envVar.id)
        return newSet
      })
    }, 2000)
  }

  const toggleValueVisibility = (varId: string) => {
    setVisibleValues(prev => {
      const newSet = new Set(prev)
      if (newSet.has(varId)) {
        newSet.delete(varId)
      } else {
        newSet.add(varId)
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setVisibleValues(current => {
            const updated = new Set(current)
            updated.delete(varId)
            return updated
          })
        }, 3000)
      }
      return newSet
    })
  }

  const maskedValue = (value: string) => {
    if (value.length <= 8) return '••••••••'
    return value.substring(0, 4) + '••••••••••••••••' + value.substring(value.length - 4)
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split('\n')
        const newVars: EnvironmentVariable[] = []

        lines.forEach(line => {
          const trimmed = line.trim()
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=')
            const value = valueParts.join('=').replace(/^["']|["']$/g, '') // Remove surrounding quotes
            
            if (key.trim() && value.trim() && !envVars.some(v => v.key === key.trim())) {
              newVars.push({
                id: `imported-${Date.now()}-${Math.random()}`,
                key: key.trim(),
                value: value.trim(),
                createdAt: new Date(),
                updatedAt: new Date()
              })
            }
          }
        })

        if (newVars.length > 0) {
          setEnvVars(prev => [...prev, ...newVars])
          showSuccess(`Imported ${newVars.length} environment variables`, 'Successfully loaded from file')
        } else {
          showWarning('No valid environment variables found in file', 'Please check the file format')
        }
      } catch {
        showError('Failed to parse file', 'Invalid file format or corrupted data')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    event.target.value = ''
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Environment Variables</h2>
        <p className="text-muted-foreground">
          Manage environment variables for your Digital Hustle Lab application
        </p>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="sensitive"
              checked={isSensitive}
              onCheckedChange={setIsSensitive}
            />
            <Label htmlFor="sensitive">
              Sensitive - values are hidden by default
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Add New Variable */}
      <Card>
        <CardHeader>
          <CardTitle>Add Environment Variable</CardTitle>
          <CardDescription>
            Add a new key-value pair to your environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newKey">Key</Label>
              <Input
                id="newKey"
                placeholder="e.g., API_KEY"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="newValue">Value</Label>
              <Input
                id="newValue"
                placeholder="e.g., your-api-key-here"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                type={isSensitive ? "password" : "text"}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddVariable}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".env,.txt"
                onChange={handleImportFile}
                className="hidden"
                id="import-file"
              />
              <Button variant="outline" asChild>
                <label htmlFor="import-file" className="cursor-pointer flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Import .env File
                </label>
              </Button>
            </div>
            <Button variant="outline">
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search environment variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables List */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            {filteredEnvVars.length} variable(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEnvVars.map((envVar) => (
              <div key={envVar.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  {editingId === envVar.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        value={editKey}
                        onChange={(e) => setEditKey(e.target.value)}
                        placeholder="Key"
                      />
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Value"
                        type={isSensitive ? "password" : "text"}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(envVar.key, 'Key')}
                          className="font-medium hover:text-primary cursor-pointer"
                        >
                          {envVar.key}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-muted-foreground font-mono">
                          {visibleValues.has(envVar.id) || !isSensitive ? envVar.value : maskedValue(envVar.value)}
                        </code>
                        {isSensitive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleValueVisibility(envVar.id)}
                            className="h-6 w-6 p-0"
                          >
                            {visibleValues.has(envVar.id) ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(envVar.value, 'Value')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    Updated {envVar.updatedAt.toLocaleDateString()}
                  </div>
                  {editingId === envVar.id ? (
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditVariable(envVar.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Environment Variable</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{envVar.key}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteVariable(envVar.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
