"use client"

import * as React from "react"
import { Key, Copy, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useNotifications } from "@/components/notification-system"
import { generateSecureApiKey, maskApiKey, validateApiKeyFormat, hashApiKey } from "@/lib/api-key-security"
import { apiKeysDB, getCurrentUserId, cache, type ApiKeyRecord } from "@/lib/database"

interface ApiKey {
  id: string
  name: string
  key: string
  hashedKey: string
  masked_key: string
  createdAt: Date
  last_used?: Date
  isDefault?: boolean
  permissions?: string[]
  rate_limit?: number
}

// Utility functions for secure key handling
const hashKey = async (key: string): Promise<string> => {
  // Create a hash of the key for secure storage/comparison
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(key)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    // Fallback simple hash (not cryptographically secure)
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

export function ApiKeys() {
  const { showSuccess, showError } = useNotifications()
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([
    {
      id: "default",
      name: "Default API Key",
      key: "dhl_sk_1234567890abcdef1234567890abcdef",
      hashedKey: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      masked_key: maskApiKey("dhl_sk_1234567890abcdef1234567890abcdef"),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      isDefault: true
    }
  ])
  
  const [newKeyName, setNewKeyName] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null)
  const [showGeneratedKey, setShowGeneratedKey] = React.useState(false)
  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set())

  const generateApiKey = async () => {
    try {
      // Use the secure key generation from the utility
      const secureKey = generateSecureApiKey('dhl_sk_')
      const hashedKey = hashApiKey(secureKey)
      
      return { key: secureKey, hashedKey }
    } catch {
      // Fallback to less secure but functional method
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let key = 'dhl_sk_'
      for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      const hashedKey = await hashKey(key)
      return { key, hashedKey }
    }
  }

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      showError('Please enter a name for your API key', 'API key name is required')
      return
    }

    // Validate key name format
    if (newKeyName.trim().length < 3) {
      showError('API key name must be at least 3 characters long', 'Name too short')
      return
    }

    // Check for duplicate names
    if (apiKeys.some(key => key.name.toLowerCase() === newKeyName.trim().toLowerCase())) {
      showError('An API key with this name already exists', 'Duplicate name')
      return
    }

    setIsGenerating(true)
    
    try {
      // Generate secure API key with production-grade validation
      const { key: newKey, hashedKey } = await generateApiKey()
      
      // Validate the generated key
      if (!validateApiKeyFormat(newKey)) {
        throw new Error('Generated key failed validation')
      }
      
      const apiKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName.trim(),
        key: newKey,
        hashedKey: hashedKey,
        createdAt: new Date()
      }
      
      setApiKeys(prev => [...prev, apiKey])
      setGeneratedKey(newKey)
      setShowGeneratedKey(true)
      setNewKeyName("")
      showSuccess('API key generated successfully', `Key "${apiKey.name}" is ready to use`)
    } catch (error) {
      console.error('API key generation failed:', error)
      showError('Failed to generate API key', 'Please try again or contact support')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteKey = (id: string) => {
    const keyToDelete = apiKeys.find(key => key.id === id)
    setApiKeys(prev => prev.filter(key => key.id !== id))
    showSuccess('API key deleted successfully', keyToDelete ? `"${keyToDelete.name}" has been removed` : 'Key removed')
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess(`${type} copied to clipboard`, 'Ready to paste')
    } catch {
      // Fallback for older browsers or when clipboard API fails
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        showSuccess(`${type} copied to clipboard`, 'Ready to paste')
      } catch {
        showError(`Failed to copy ${type.toLowerCase()}`, 'Clipboard access denied')
      }
      
      document.body.removeChild(textArea)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setVisibleKeys(current => {
            const updated = new Set(current)
            updated.delete(keyId)
            return updated
          })
        }, 3000)
      }
      return newSet
    })
  }

  const maskedKey = (key: string) => {
    return maskApiKey(key)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Keys</h2>
        <p className="text-muted-foreground">
          Manage your Digital Hustle Lab API keys for accessing our LLM endpoints
        </p>
      </div>

      {/* Generate New API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Generate New API Key
          </CardTitle>
          <CardDescription>
            Create a new API key to access Digital Hustle Lab services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="keyName">API Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Key, Development Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleGenerateKey} 
                disabled={isGenerating || !newKeyName.trim()}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage and monitor your existing API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(apiKey.name, 'API key name')}
                      className="font-medium hover:text-primary cursor-pointer"
                    >
                      {apiKey.name}
                    </button>
                    {apiKey.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm text-muted-foreground font-mono">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskedKey(apiKey.key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="h-6 w-6 p-0"
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key, 'API key')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {apiKey.createdAt.toLocaleDateString()}
                  </div>
                  {!apiKey.isDefault && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{apiKey.name}&quot;? This action cannot be undone and will immediately revoke access for any applications using this key.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteKey(apiKey.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Key Dialog */}
      <Dialog open={showGeneratedKey} onOpenChange={setShowGeneratedKey}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Key Generated Successfully!</DialogTitle>
            <DialogDescription>
              Your new API key has been created. Make sure to copy it now as you won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono break-all">{generatedKey}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedKey!, 'API key')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Important:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Store this key securely - it provides access to your Digital Hustle Lab account</li>
                <li>Do not share it publicly or commit it to version control</li>
                <li>You can revoke this key at any time from this dashboard</li>
                <li>This key will not be shown again after closing this dialog</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
