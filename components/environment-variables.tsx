"use client"

import * as React from "react"
import { Settings, Plus, Copy, Trash2, Eye, EyeOff, Upload, Search, Save, X } from "lucide-react"
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

interface PendingVariable {
  id: string
  key: string
  value: string
  isSensitive: boolean
}

export function EnvironmentVariables() {
  const { showSuccess, showError, showWarning } = useNotifications()
  
  // Load saved variables from localStorage
  const [envVars, setEnvVars] = React.useState<EnvironmentVariable[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('environment-variables')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  // State for multiple pending variables
  const [pendingVars, setPendingVars] = React.useState<PendingVariable[]>([
    { id: '1', key: '', value: '', isSensitive: false }
  ])
  
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editKey, setEditKey] = React.useState("")
  const [editValue, setEditValue] = React.useState("")
  const [isSensitive, setIsSensitive] = React.useState(true)
  const [visibleValues, setVisibleValues] = React.useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = React.useState("")

  // Save to localStorage whenever envVars changes
  React.useEffect(() => {
    localStorage.setItem('environment-variables', JSON.stringify(envVars))
  }, [envVars])

  const filteredEnvVars = envVars.filter(envVar => 
    envVar.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    envVar.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add a new input row
  const handleAddVariableRow = () => {
    const newId = Date.now().toString()
    setPendingVars(prev => [...prev, { id: newId, key: '', value: '', isSensitive: false }])
  }

  // Remove a pending variable row
  const handleRemoveVariableRow = (id: string) => {
    if (pendingVars.length > 1) {
      setPendingVars(prev => prev.filter(v => v.id !== id))
    }
  }

  // Update a pending variable
  const handleUpdatePendingVar = (id: string, field: 'key' | 'value' | 'isSensitive', value: string | boolean) => {
    setPendingVars(prev => prev.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ))
  }

  // Save all pending variables
  const handleSaveAllVariables = () => {
    const validVars: EnvironmentVariable[] = []
    const errors: string[] = []

    pendingVars.forEach((pending, index) => {
      const key = pending.key.trim()
      const value = pending.value.trim()

      // Validation
      if (!key) {
        errors.push(`Row ${index + 1}: Key is required`)
        return
      }

      if (!value) {
        errors.push(`Row ${index + 1}: Value is required`)
        return
      }

      // Check for valid key format
      if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
        errors.push(`Row ${index + 1}: Key must be uppercase letters, numbers, and underscores only`)
        return
      }

      // Check for duplicate keys
      if (envVars.some(v => v.key === key) || validVars.some(v => v.key === key)) {
        errors.push(`Row ${index + 1}: Key "${key}" already exists`)
        return
      }

      // For API keys, validate format
      if (key.includes('API_KEY') && !value.startsWith('sk-') && !value.startsWith('pk-') && !value.startsWith('Bearer ')) {
        errors.push(`Row ${index + 1}: API key format is invalid`)
        return
      }

      validVars.push({
        id: Date.now().toString() + index,
        key,
        value,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    if (errors.length > 0) {
      showError('Validation Errors', errors.join('\n'))
      return
    }

    if (validVars.length === 0) {
      showWarning('No valid variables to save', 'Please fill in the required fields')
      return
    }

    // Save all valid variables
    setEnvVars(prev => [...prev, ...validVars])
    
    // Reset pending variables to one empty row
    setPendingVars([{ id: Date.now().toString(), key: '', value: '', isSensitive: false }])
    
    showSuccess(`${validVars.length} environment variable(s) saved successfully`, 'Variables are now available')
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

    if (!/^[A-Z_][A-Z0-9_]*$/.test(editKey.trim())) {
      showError('Invalid key format', 'Key must be uppercase letters, numbers, and underscores only')
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
    showSuccess('Environment variable updated successfully', `"${editKey.trim()}" has been updated`)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditKey("")
    setEditValue("")
  }

  const handleDeleteVariable = (id: string) => {
    const envVar = envVars.find(v => v.id === id)
    setEnvVars(prev => prev.filter(v => v.id !== id))
    showSuccess('Environment variable deleted successfully', `"${envVar?.key}" has been removed`)
  }

  const toggleValueVisibility = (id: string) => {
    setVisibleValues(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess(`${type} copied to clipboard`, 'Ready to paste')
    } catch {
      showError('Failed to copy to clipboard', 'Please try again')
    }
  }

  const maskValue = (value: string) => {
    if (value.length <= 8) return '••••••••'
    return value.substring(0, 4) + '••••' + value.substring(value.length - 4)
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

      {/* Add New Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Add Environment Variables</CardTitle>
          <CardDescription>
            Add multiple key-value pairs. Click &quot;Add Row&quot; to add more input fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingVars.map((pending) => (
            <div key={pending.id} className="flex items-end gap-2 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`key-${pending.id}`}>Key</Label>
                  <Input
                    id={`key-${pending.id}`}
                    placeholder="e.g., API_KEY"
                    value={pending.key}
                    onChange={(e) => handleUpdatePendingVar(pending.id, 'key', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`value-${pending.id}`}>Value</Label>
                  <Input
                    id={`value-${pending.id}`}
                    placeholder="e.g., your-api-key-here"
                    value={pending.value}
                    onChange={(e) => handleUpdatePendingVar(pending.id, 'value', e.target.value)}
                    type={isSensitive ? "password" : "text"}
                  />
                </div>
              </div>
              {pendingVars.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveVariableRow(pending.id)}
                  className="mb-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button onClick={handleAddVariableRow} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            <Button onClick={handleSaveAllVariables}>
              <Save className="h-4 w-4 mr-2" />
              Save All Variables
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
                          {visibleValues.has(envVar.id) || !isSensitive ? envVar.value : maskValue(envVar.value)}
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
                <div className="flex items-center gap-2 ml-4">
                  {editingId === envVar.id ? (
                    <>
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleEditVariable(envVar.id)}>
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
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
                            <AlertDialogAction onClick={() => handleDeleteVariable(envVar.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filteredEnvVars.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No environment variables found. Add some above to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
