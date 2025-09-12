"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Save, Eye, Zap, Cpu, Check } from 'lucide-react'

// Import modularized components
import { ParticleField, HolographicGrid, CinematicHeader, ModelCardPreview } from './components'

// Import data and types
import { ROBOT_IMAGES, MODEL_TYPES, PROVIDERS } from './data'
import type { ModelCardData } from './types'

// Import styles
import { holographicStyles } from './styles'

export function ControlPanelRobots() {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [formData, setFormData] = useState<ModelCardData>({
    id: '',
    name: '',
    provider: '',
    description: '',
    modelType: '',
    status: 'Available',
    contextWindow: '',
    responseTime: '',
    imageUrl: ROBOT_IMAGES[0].url,
    usageCount: 0,
    fontFamily: 'Inter',
    providerIconUrl: '',
    brandLogoUrl: '',
    cardBackgroundColor: 'from-white via-gray-50 to-gray-100',
    headerBackgroundColor: 'from-orange-600 via-orange-500 to-red-600',
    glowColor: 'rgba(249,115,22,0.3)',
    shadowColor: 'rgba(249,115,22,0.4)'
  })

  // Cinematic entrance effect with staggered animations
  useEffect(() => {
    const phases = [
      { delay: 100, phase: 1 }, // Title appears
      { delay: 600, phase: 2 }, // Form section slides in
      { delay: 1200, phase: 3 }, // Preview card materializes
      { delay: 1800, phase: 4 }  // Final holographic effects activate
    ]
    
    setIsLoaded(true)
    
    phases.forEach(({ delay, phase }) => {
      setTimeout(() => setAnimationPhase(phase), delay)
    })
  }, [])

  const handleInputChange = (field: keyof ModelCardData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    console.log('Saving model card:', formData)
    // TODO: Implement save functionality to update the Models page
    alert('Model card saved! (Implementation needed to update Models page)')
  }

  const handleReset = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      provider: '',
      modelType: 'Text',
      contextWindow: '128K tokens',
      responseTime: '2.3s',
      imageUrl: ROBOT_IMAGES[0].url,
      status: 'Available',
      usageCount: 0,
      fontFamily: 'Inter',
      providerIconUrl: '',
      brandLogoUrl: '',
      cardBackgroundColor: 'from-white via-gray-50 to-gray-100',
      headerBackgroundColor: 'from-orange-600 via-orange-500 to-red-600',
      glowColor: 'rgba(249,115,22,0.3)',
      shadowColor: 'rgba(249,115,22,0.4)'
    })
  }

  return <>
      {/* Inject Holographic Styles */}
      <style dangerouslySetInnerHTML={{ __html: holographicStyles }} />
      
      {/* Cinematic Laboratory Interface */}
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-all duration-2000 screen-flicker ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Holographic Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <HolographicGrid />
          <ParticleField />
          

        </div>
        
        {/* Cinematic Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 blur-3xl"></div>
          <h1 className={`relative text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4 transition-all duration-2000 ${
            animationPhase >= 1 ? 'title-materialize' : 'opacity-0 translate-y-10 scale-110'
          }`} 
              style={{fontFamily: 'Orbitron, monospace'}}>
            AI Laboratory
          </h1>
          <div className={`flex justify-center items-center gap-4 mb-6 transition-all duration-1500 delay-500 ${
            animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}>
            <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
            <p className="text-xl text-cyan-300/80 font-mono tracking-wider">
              Neural Model Configuration Center
            </p>
            <Cpu className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          
          {/* Holographic scanning line */}
          <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all duration-1000 delay-1000 ${
            animationPhase >= 1 ? 'opacity-60 scale-x-100' : 'opacity-0 scale-x-0'
          }`}>
            <div className="absolute inset-0 bg-cyan-400 animate-pulse"></div>
          </div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className={`space-y-6 transition-all duration-1500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Holographic Form Section */}
              <Card className={`holographic-card border-cyan-400/30 bg-slate-900/80 backdrop-blur-md shadow-2xl transition-all duration-1000 ambient-pulse ${
                 animationPhase >= 2 ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-20 opacity-0 scale-95'
               }`}>
                <CardHeader className="border-b border-cyan-400/20">
                  <CardTitle className="flex items-center gap-2 text-cyan-300 font-mono" style={{fontFamily: 'Orbitron, monospace'}}>
                    <Plus className="w-5 h-5 text-cyan-400 animate-pulse" />
                    CREATE MODEL CARD
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Configure your AI agent parameters. Real-time preview active.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
            {/* Model Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium">Model Name</Label>
              <Input
                id="name"
                placeholder="e.g., GPT-4, Claude Sonnet, Llama 2"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Provider */}
            <div className="space-y-1">
              <Label htmlFor="provider" className="text-sm font-medium">Provider</Label>
              <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or enter custom provider name..."
                value={formData.provider && !PROVIDERS.includes(formData.provider) ? formData.provider : ""}
                onChange={(e) => handleInputChange('provider', e.target.value)}
                className="text-sm h-8"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the AI model's capabilities, strengths, and use cases..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Enhanced Model Type Selector */}
              <div className="space-y-1">
                <Label htmlFor="modelType" className="text-sm font-medium">Model Type</Label>
                <Select value={formData.modelType} onValueChange={(value) => handleInputChange('modelType', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select model category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {MODEL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    <SelectItem value="custom">
                      + Custom Model Type
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or enter custom model type..."
                  value={formData.modelType && !MODEL_TYPES.includes(formData.modelType) ? formData.modelType : ""}
                  onChange={(e) => handleInputChange('modelType', e.target.value)}
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'Available' | 'Busy' | 'Offline') => handleInputChange('status', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Character Image URL */}
            <div className="space-y-1">
              <Label htmlFor="characterImageUrl" className="text-sm font-medium">Character Image URL</Label>
              <Input
                id="characterImageUrl"
                placeholder="https://example.com/robot-avatar.png"
                value={formData.imageUrl || ''}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Provider Icon URL */}
            <div className="space-y-1">
              <Label htmlFor="providerIconUrl" className="text-sm font-medium">Provider Icon URL</Label>
              <Input
                id="providerIconUrl"
                placeholder="https://example.com/provider-logo.png"
                value={formData.providerIconUrl || ''}
                onChange={(e) => handleInputChange('providerIconUrl', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contextWindow" className="text-sm font-medium">Context Window</Label>
                <Input
                  id="contextWindow"
                  placeholder="e.g., 128K tokens"
                  value={formData.contextWindow}
                  onChange={(e) => handleInputChange('contextWindow', e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="responseTime" className="text-sm font-medium">Response Time</Label>
                <Input
                  id="responseTime"
                  placeholder="e.g., 2.3s"
                  value={formData.responseTime}
                  onChange={(e) => handleInputChange('responseTime', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Color Controls */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Color Controls</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="cardBg" className="text-xs text-gray-600">Card Background</Label>
                  <Input
                    id="cardBg"
                    placeholder="from-white via-gray-50 to-gray-100"
                    value={formData.cardBackgroundColor}
                    onChange={(e) => handleInputChange('cardBackgroundColor', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="headerBg" className="text-xs text-gray-600">Header Background</Label>
                  <Input
                    id="headerBg"
                    placeholder="from-orange-600 to-red-600"
                    value={formData.headerBackgroundColor}
                    onChange={(e) => handleInputChange('headerBackgroundColor', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="glowColor" className="text-xs text-gray-600">Glow Color</Label>
                  <Input
                    id="glowColor"
                    placeholder="rgba(249,115,22,0.3)"
                    value={formData.glowColor}
                    onChange={(e) => handleInputChange('glowColor', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="shadowColor" className="text-xs text-gray-600">Shadow Color</Label>
                  <Input
                    id="shadowColor"
                    placeholder="rgba(249,115,22,0.4)"
                    value={formData.shadowColor}
                    onChange={(e) => handleInputChange('shadowColor', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Font Selector */}
            <div className="space-y-1">
              <Label htmlFor="fontFamily" className="text-sm font-medium">Font Family</Label>
              <Select value={formData.fontFamily} onValueChange={(value) => handleInputChange('fontFamily', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                  <SelectItem value="Nunito">Nunito</SelectItem>
                  <SelectItem value="Raleway">Raleway</SelectItem>
                  <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Robot Image Selector - Thumbnail Grid */}
            <div className="space-y-1">
              <Label className="font-semibold">Robot Avatar</Label>
              <div className="grid grid-cols-6 gap-2 mb-2">
                {ROBOT_IMAGES.map((robot) => (
                  <button
                    key={robot.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: robot.url })}
                    className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      formData.imageUrl === robot.url 
                        ? 'border-orange-500 ring-2 ring-orange-200 shadow-lg' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <img
                      src={robot.url}
                      alt={robot.name}
                      className="w-full h-full object-contain rounded-md"
                      title={robot.name}
                    />
                    {formData.imageUrl === robot.url && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {/* Custom uploader removed */}
            </div>

            {/* Provider Icon */}
            <div className="space-y-1">
              <Label className="font-semibold">Provider Icon</Label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {formData.providerIconUrl && (
                  <div className="col-span-4 flex justify-center">
                    <img src={formData.providerIconUrl} alt="Provider Icon" className="w-16 h-16 object-contain rounded" />
                  </div>
                )}
              </div>
              {/* Custom uploader removed */}
            </div>

            <div className="flex gap-2 pt-3">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Model Card
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Holographic Preview Section */}
        <Card className={`holographic-card holographic-glow border-cyan-400/30 bg-slate-900/80 backdrop-blur-md shadow-2xl transition-all duration-1200 ambient-pulse ${
           animationPhase >= 3 ? 'translate-x-0 opacity-100 scale-100 rotate-0' : 'translate-x-20 opacity-0 scale-95 rotate-1'
         }`}>
          <CardHeader className="border-b border-cyan-400/20">
            <CardTitle className="flex items-center gap-2 text-cyan-300 font-mono" style={{fontFamily: 'Orbitron, monospace'}}>
              <Eye className="w-5 h-5 text-cyan-400 animate-pulse" />
              LIVE PREVIEW
            </CardTitle>
            <CardDescription className="text-cyan-200/70">
              Real-time model card visualization active.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <ModelCardPreview 
                data={formData}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
                cinematicPhase={animationPhase}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</div>
  </>
}

export default ControlPanelRobots