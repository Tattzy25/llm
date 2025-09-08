import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModelCategory } from "@/types/model-types"
import { ModelGrid } from "./ModelGrid"

interface CategoryTabsProps {
  modelCategories: Record<string, ModelCategory>
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedModel: string
  onModelSelect: (modelId: string) => void
}

export function CategoryTabs({
  modelCategories,
  selectedCategory,
  onCategoryChange,
  selectedModel,
  onModelSelect
}: CategoryTabsProps) {
  return (
    <Tabs value={selectedCategory} onValueChange={onCategoryChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {Object.keys(modelCategories).map((categoryKey) => {
          const category = modelCategories[categoryKey]
          return (
            <TabsTrigger key={categoryKey} value={categoryKey} className="text-xs">
              {category.name} ({category.models.length})
            </TabsTrigger>
          )
        })}
      </TabsList>

      {Object.keys(modelCategories).map((categoryKey) => {
        const category = modelCategories[categoryKey]
        return (
          <TabsContent key={categoryKey} value={categoryKey} className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category.models.length} model{category.models.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <ModelGrid
              models={category.models}
              selectedModel={selectedModel}
              onModelSelect={onModelSelect}
            />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
