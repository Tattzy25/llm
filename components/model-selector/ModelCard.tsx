import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModelInfo } from "@/types/model-types"

interface ModelCardProps {
  model: ModelInfo
  isSelected: boolean
  isRecommended: boolean
  onSelect: (modelId: string) => void
}

export function ModelCard({ model, isSelected, isRecommended, onSelect }: ModelCardProps) {
  const IconComponent = model.icon

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${isRecommended ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}`}
      onClick={() => onSelect(model.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${model.color}`}>
              <IconComponent className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{model.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {model.provider}
                </Badge>
                {isRecommended && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    Recommended
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <CardDescription className="text-xs">
            {model.description}
          </CardDescription>
          <div className="flex justify-between text-xs text-muted-foreground">
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
