"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelCardData } from '../types'

interface Props {
  data: ModelCardData
  isFlipped: boolean
  onFlip: () => void
  cinematicPhase: number
}

export function ModelCardPreview({ data, isFlipped, onFlip, cinematicPhase }: Props) {
  return (
    <div className="w-80 h-96 perspective-1000 cursor-pointer group" onClick={onFlip}>
      <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''} ${cinematicPhase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Front Side */}
        <div className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden" style={{
          background: `linear-gradient(${data.cardBackgroundColor})`,
          boxShadow: `0 0 20px ${data.shadowColor}`,
        }}>
          <Card className="h-full border-0">
            <CardHeader className={`p-4 bg-gradient-to-r ${data.headerBackgroundColor} text-white`}>
              <CardTitle className="text-xl" style={{fontFamily: data.fontFamily}}>{data.name}</CardTitle>
              <CardDescription className="text-sm opacity-80">{data.provider}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <img src={data.imageUrl} alt={data.name} className="w-full h-40 object-cover rounded-lg mb-4" style={{boxShadow: `0 0 10px ${data.glowColor}`}} />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Type: {data.modelType}</div>
                <div>Status: {data.status}</div>
                <div>Context: {data.contextWindow}</div>
                <div>Response: {data.responseTime}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Back Side */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden" style={{
          background: `linear-gradient(${data.cardBackgroundColor})`,
          boxShadow: `0 0 20px ${data.shadowColor}`,
          transform: 'rotateY(180deg)'
        }}>
          <Card className="h-full border-0">
            <CardHeader className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <CardTitle className="text-xl" style={{fontFamily: data.fontFamily}}>Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm mb-4">{data.description}</p>
              <div className="space-y-2 text-sm">
                <div>Usage Count: {data.usageCount}</div>
                <div>Provider Icon: {data.providerIconUrl ? 'Yes' : 'No'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}