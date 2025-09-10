import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModelInfo } from "@/types/model-types"
import { useState } from "react"

interface ModelCardProps {
  model: ModelInfo
  isSelected: boolean
  isRecommended: boolean
  onSelect: (modelId: string) => void
  robotImage?: string
  usageCount?: number
  responseTime?: string
  status?: 'online' | 'busy' | 'offline'
}

export function ModelCard({ 
  model, 
  isSelected, 
  isRecommended, 
  onSelect, 
  robotImage,
  usageCount = 0,
  responseTime = "~2.3s",
  status = 'online'
}: ModelCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const IconComponent = model.icon

  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-yellow-500', 
    offline: 'bg-red-500'
  }

  const statusText = {
    online: 'Available',
    busy: 'Busy',
    offline: 'Offline'
  }

  return (
    <div 
      className="relative w-full h-96 cursor-pointer group perspective-1000"
      onClick={() => onSelect(model.id)}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      {/* Card Container with 3D flip */}
      <div className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front of Card */}
        <Card className={`absolute inset-0 backface-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 text-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ${
          isSelected ? "ring-2 ring-orange-500 shadow-orange-200" : ""
        }`}>
          
          {/* Header with robot image and gradient */}
          <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl shadow-lg group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 opacity-90" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse" />
            
            {/* Robot Image or Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {robotImage ? (
                <img 
                  src={robotImage} 
                  alt={model.name}
                  className="w-20 h-20 object-contain transform transition-transform group-hover:scale-110 duration-300"
                />
              ) : (
                <IconComponent className="w-20 h-20 text-white/90 transform transition-transform group-hover:scale-110 duration-300" />
              )}
            </div>

            {/* Status Indicator */}
            <div className="absolute top-3 right-3">
              <div className={`w-3 h-3 rounded-full ${statusColors[status]} animate-pulse`}></div>
            </div>

            {/* Recommended Badge */}
            {isRecommended && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-green-500 text-white text-xs">
                  ⭐ Top Pick
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-6">
            <h5 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
              {model.name}
            </h5>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                {model.provider}
              </Badge>
              <span className={`text-xs px-2 py-1 rounded-full text-white ${statusColors[status]}`}>
                {statusText[status]}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {model.description}
            </p>
            
            {/* Quick Stats */}
            <div className="flex justify-between text-xs text-gray-500 mt-4">
              <span>Used: {usageCount}x</span>
              <span>Speed: {responseTime}</span>
            </div>
          </CardContent>

          {/* Button */}
          <div className="p-6 pt-0">
            <button className="group relative w-full inline-flex items-center justify-center px-6 py-3 font-bold text-white rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5">
              <span className="relative flex items-center gap-2">
                Select Model
                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-5 h-5 transform transition-transform group-hover:translate-x-1">
                  <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          </div>
        </Card>

        {/* Back of Card */}
        <Card className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div>
              <h5 className="text-xl font-semibold text-orange-400 mb-4">
                {model.name} Specs
              </h5>
              
              {/* Detailed Information */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Context Window:</span>
                  <span className="text-white">{model.contextWindow || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Max Tokens:</span>
                  <span className="text-white">{model.maxTokens || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Response Time:</span>
                  <span className="text-white">{responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Usage Count:</span>
                  <span className="text-white">{usageCount}</span>
                </div>
              </div>

              {/* Features/Capabilities */}
              <div className="mt-4">
                <h6 className="text-orange-400 font-medium mb-2">Capabilities:</h6>
                <div className="flex flex-wrap gap-1">
                  {model.features?.slice(0, 4).map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-orange-400 text-orange-300">
                      {feature}
                    </Badge>
                  )) || (
                    <>
                      <Badge variant="outline" className="text-xs border-orange-400 text-orange-300">Text Generation</Badge>
                      <Badge variant="outline" className="text-xs border-orange-400 text-orange-300">Analysis</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Try Now Button */}
            <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-lg">
              Try This Model
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
            <span>Max: {model.maxTokens.toLocaleString()}</span>
            <span>Context: {model.contextWindow.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {model.strengths.slice(0, 2).map((strength, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {strength}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
