import * as React from "react"
import { ModelSelectorProps } from "@/types/model-types"
import { features } from "@/config/features"
import { modelCategories } from "@/config/model-categories"
import { CategoryTabs } from "./CategoryTabs"
import { ModelGrid } from "./ModelGrid"
import { FeatureSelector } from "./FeatureSelector"
import { CustomModelDialog } from "./CustomModelDialog"
import { Button } from "@/components/ui/button"
import { ModelCard } from "./ModelCard"

export function ModelSelector({ selectedModel, onModelSelect, currentFeature }: ModelSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('openai')
  const [viewMode, setViewMode] = React.useState<'categories' | 'features'>('categories')
  const [showCustomDialog, setShowCustomDialog] = React.useState(false)

  const totalModels = Object.values(modelCategories).reduce((sum, cat) => {
    if (typeof cat === 'object' && cat !== null && 'models' in cat) {
      return sum + cat.models.length
    }
    return sum
  }, 0)

  const getRecommendedModels = (featureId: string) => {
    const feature = features.find(f => f.id === featureId)
    if (!feature) return []

    return feature.recommendedModels
      .map(modelId => {
        // Find the model in all categories
        for (const category of Object.values(modelCategories)) {
          if (typeof category === 'object' && category !== null && 'models' in category) {
            const model = category.models.find((m) => m.id === modelId)
            if (model) return model
          }
        }
        return null
      })
      .filter((model): model is NonNullable<typeof model> => model !== null)
  }

  const recommendedModels = currentFeature ? getRecommendedModels(currentFeature) : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Model</h2>
        <p className="text-muted-foreground">
          Select from {totalModels} available models across different providers
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'categories' ? "default" : "outline"}
            onClick={() => setViewMode('categories')}
            size="sm"
          >
            By Provider
          </Button>
          <Button
            variant={viewMode === 'features' ? "default" : "outline"}
            onClick={() => setViewMode('features')}
            size="sm"
          >
            By Feature
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowCustomDialog(true)}
          size="sm"
        >
          Add Custom Model
        </Button>
      </div>

      {/* Current Feature Display */}
      {currentFeature && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium">Current Feature: {features.find(f => f.id === currentFeature)?.name}</h3>
          <p className="text-sm text-muted-foreground">
            {features.find(f => f.id === currentFeature)?.useCase}
          </p>
        </div>
      )}

      {/* Recommended Models for Current Feature */}
      {recommendedModels.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recommended for {features.find(f => f.id === currentFeature)?.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendedModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                onSelect={() => onModelSelect(model.id)}
                isRecommended={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs or Feature Tabs */}
      {viewMode === 'categories' ? (
        <CategoryTabs
          modelCategories={modelCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedModel={selectedModel}
          onModelSelect={onModelSelect}
        />
      ) : (
        <div className="space-y-6">
          <FeatureSelector features={features} currentFeature={currentFeature} />
          {features.map((feature) => (
            <div key={feature.id}>
              <div className="flex items-center gap-3 mb-4">
                <feature.icon className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">{feature.name}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <ModelGrid
                models={getRecommendedModels(feature.id)}
                selectedModel={selectedModel}
                onModelSelect={onModelSelect}
              />
            </div>
          ))}
        </div>
      )}

      {/* Custom Model Dialog */}
      <CustomModelDialog
        showDialog={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        onModelAdded={() => {
          // Refresh or update state as needed
        }}
      />
    </div>
  )
}
