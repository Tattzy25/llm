import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeatureInfo } from "@/types/model-types"

interface FeatureSelectorProps {
  features: FeatureInfo[]
  currentFeature?: string
}

export function FeatureSelector({ features, currentFeature }: FeatureSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((feature) => {
        const IconComponent = feature.icon
        const isCurrentFeature = currentFeature === feature.id
        return (
          <Card
            key={feature.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              isCurrentFeature ? "ring-2 ring-primary bg-blue-50 dark:bg-blue-950" : ""
            }`}
            onClick={() => {/* Feature selection could trigger model filtering */}}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <IconComponent className="h-5 w-5" />
                <div>
                  <CardTitle className="text-sm font-medium">{feature.name}</CardTitle>
                  <Badge variant="outline" className="text-xs mt-1">
                    {feature.recommendedModels.length} models
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs mb-2">
                {feature.description}
              </CardDescription>
              <p className="text-xs text-muted-foreground">
                {feature.useCase}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
