import * as React from "react"
import { ModelInfo } from "@/types/model-types"
import { ModelCard } from "./ModelCard"

interface ModelGridProps {
  models: ModelInfo[]
  selectedModel: string
  onModelSelect: (modelId: string) => void
}

export function ModelGrid({ models, selectedModel, onModelSelect }: ModelGridProps) {
  if (models.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No models available for this category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={selectedModel === model.id}
          onSelect={() => onModelSelect(model.id)}
          isRecommended={false}
        />
      ))}
    </div>
  )
}
