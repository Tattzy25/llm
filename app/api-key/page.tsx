"use client"

import { useState, useEffect } from "react"
import { validateApiKeyWithProvider, getValidationStatusMessage } from "@/lib/api-validation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Save,
  RefreshCw,
  Shield,
  Zap,
  Bot,
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils"

interface APIKey {
  provider: string
  key: string
  isValid: boolean | null
  lastValidated?: Date
}

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, and other OpenAI models',
    icon: Bot,
    color: 'bg-blue-500',
    models: ['gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude and other Anthropic models',
    icon: Shield,
    color: 'bg-orange-500',
    models: ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus']
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference with Llama models',
    icon: Zap,
    color: 'bg-purple-500',
    models: ['llama-3.1-70b', 'llama-3.1-8b', 'mixtral-8x7b']
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini and other Google models',
    icon: Globe,
    color: 'bg-green-500',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'palm-2']
  }
]

export default function APIKeyPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, APIKey>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing localStorage
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load saved API keys on mount
  useEffect(() => {
    if (!mounted) return
    
    const savedKeys = localStorage.getItem('api-keys')
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys)
        setApiKeys(parsed)
      } catch (error) {
        console.error('Failed to parse saved API keys:', error)
      }
    }
  }, [mounted])

  const handleKeyChange = (provider: string, key: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        provider,
        key,
        isValid: null
      }
    }))
  }

  const validateKey = async (provider: string) => {
    const apiKey = apiKeys[provider]
    if (!apiKey?.key) return

    setIsValidating(prev => ({ ...prev, [provider]: true }))

    try {
      // Production-grade API key validation with actual endpoint calls
      const isValid = await validateApiKeyWithProvider(provider, apiKey.key)

      setApiKeys(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isValid,
          lastValidated: new Date()
        }
      }))
    } catch (error) {
      console.error(`API key validation failed for ${provider}:`, error)
      setApiKeys(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isValid: false,
          lastValidated: new Date(),
          error: error instanceof Error ? error.message : 'Validation failed'
        }
      }))
    } finally {
      setIsValidating(prev => ({ ...prev, [provider]: false }))
    }
  }

  const saveKeys = () => {
    if (!mounted) return
    
    setSaveStatus('saving')
    try {
      localStorage.setItem('api-keys', JSON.stringify(apiKeys))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save API keys to localStorage:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  // Show loading state during initial mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>API Keys</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>API Keys</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">API Key Management</h1>
              <p className="text-muted-foreground">
                Configure API keys for different AI providers to enable model access
              </p>
            </div>
            <Button
              onClick={saveKeys}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Keys'}
            </Button>
          </div>

          {saveStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to save API keys. Please try again.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {PROVIDERS.map((provider) => {
              const apiKey = apiKeys[provider.id]
              const isValidatingKey = isValidating[provider.id]
              const showKey = showKeys[provider.id]
              const IconComponent = provider.icon

              return (
                <Card key={provider.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", provider.color)}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <CardDescription>{provider.description}</CardDescription>
                      </div>
                      {apiKey?.isValid !== null && (
                        <Badge variant={apiKey.isValid ? "default" : "destructive"}>
                          {apiKey.isValid ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Valid</>
                          ) : (
                            <><AlertCircle className="h-3 w-3 mr-1" /> Invalid</>
                          )}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-key`}>API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={`${provider.id}-key`}
                            type={showKey ? "text" : "password"}
                            placeholder={`Enter your ${provider.name} API key`}
                            value={apiKey?.key || ''}
                            onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => toggleKeyVisibility(provider.id)}
                          >
                            {showKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => validateKey(provider.id)}
                          disabled={!apiKey?.key || isValidatingKey}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className={cn("h-4 w-4", isValidatingKey && "animate-spin")} />
                          Test
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {provider.models.map((model) => (
                        <Badge key={model} variant="secondary" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>

                    {apiKey?.lastValidated && (
                      <p className="text-xs text-muted-foreground">
                        Last validated: {apiKey.lastValidated.toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> API keys are stored locally in your browser.
              Never share your API keys with anyone and consider using environment variables
              for production deployments.
            </AlertDescription>
          </Alert>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
