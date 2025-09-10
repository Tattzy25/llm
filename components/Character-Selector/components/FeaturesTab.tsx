import React from "react"
import { Sparkles, Star, Zap, Shield, Heart, Brain, Target, Users, Lightbulb, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { CharacterFormData } from "../types"
import { featureCategories } from "../data"

interface FeaturesTabProps {
  characterForm: CharacterFormData
  onToggleFeature: (featureId: string) => void
  onUpdateFeatureSetting: (featureId: string, setting: string, value: number | boolean) => void
  featureSettings: Record<string, { level: number; enabled: boolean }>
}

export function FeaturesTab({
  characterForm,
  onToggleFeature,
  onUpdateFeatureSetting,
  featureSettings
}: FeaturesTabProps) {
  const getFeatureIcon = (featureId: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'memory': Brain,
      'learning': Lightbulb,
      'empathy': Heart,
      'creativity': Sparkles,
      'logic': Target,
      'social': Users,
      'leadership': Trophy,
      'adaptability': Zap,
      'resilience': Shield,
      'wisdom': Star
    }
    return iconMap[featureId] || Star
  }

  const getFeatureColor = (featureId: string) => {
    const colorMap: Record<string, string> = {
      'memory': 'from-blue-500 to-cyan-500',
      'learning': 'from-purple-500 to-pink-500',
      'empathy': 'from-red-500 to-pink-500',
      'creativity': 'from-orange-500 to-yellow-500',
      'logic': 'from-green-500 to-teal-500',
      'social': 'from-indigo-500 to-purple-500',
      'leadership': 'from-amber-500 to-orange-500',
      'adaptability': 'from-lime-500 to-green-500',
      'resilience': 'from-slate-500 to-gray-500',
      'wisdom': 'from-violet-500 to-purple-500'
    }
    return colorMap[featureId] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Specializations
            </h3>
            <p className="text-sm text-muted-foreground">Choose your character&apos;s areas of expertise and personality traits</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300">
          {characterForm.preferredFeatures.length} selected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(featureCategories).map(([categoryId, category]) => (
          <Card key={categoryId} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${getFeatureColor(categoryId)} text-white shadow-lg`}>
                  {React.createElement(category.icon, { className: "h-5 w-5" })}
                </div>
                <span className="bg-gradient-to-r from-gray-700 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                  {category.name}
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {category.description}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {category.features.map((feature: { id: string; name: string; description: string }) => {
                  const isSelected = characterForm.preferredFeatures.includes(feature.id)
                  const settings = featureSettings[feature.id] || {
                    level: 1,
                    enabled: true
                  }
                  const IconComponent = getFeatureIcon(feature.id)

                  return (
                    <div
                      key={feature.id}
                      className={`group/feature p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 shadow-md ring-1 ring-purple-200'
                          : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50/30 dark:hover:from-gray-800 dark:hover:to-purple-950/20 border-gray-100 hover:border-purple-200 hover:shadow-md'
                      }`}
                      onClick={() => onToggleFeature(feature.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg transition-all duration-300 ${
                            isSelected
                              ? `bg-gradient-to-r ${getFeatureColor(feature.id)} text-white shadow-lg`
                              : 'bg-gray-100 dark:bg-gray-800 group-hover/feature:bg-purple-100 dark:group-hover/feature:bg-purple-900/30'
                          }`}>
                            <IconComponent className={`h-4 w-4 transition-colors duration-300 ${
                              isSelected ? 'text-white' : 'text-gray-600 group-hover/feature:text-purple-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold transition-colors duration-300 ${
                              isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white group-hover/feature:text-purple-700 dark:group-hover/feature:text-purple-300'
                            }`}>
                              {feature.name}
                            </h4>
                            <p className={`text-xs transition-colors duration-300 ${
                              isSelected ? 'text-purple-600' : 'text-muted-foreground group-hover/feature:text-purple-600'
                            }`}>
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div className="space-y-3 pt-2 border-t border-purple-100 dark:border-purple-800">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={settings.enabled}
                              onCheckedChange={(checked: boolean) => onUpdateFeatureSetting(feature.id, 'enabled', checked)}
                              className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                            />
                            <Label className="text-sm font-medium cursor-pointer">Enable this feature</Label>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Proficiency Level
                              </Label>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 transition-colors duration-300 ${
                                      i < settings.level
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={settings.level}
                              onChange={(e) => onUpdateFeatureSetting(feature.id, 'level', parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-500"
                              aria-label={`Proficiency level for ${feature.name}`}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Beginner</span>
                              <span>Expert</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {characterForm.preferredFeatures.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              Selected Specializations ({characterForm.preferredFeatures.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Your character&apos;s areas of expertise and personality traits</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {characterForm.preferredFeatures.map((featureId: string) => {
                const feature = (Object.values(featureCategories) as Array<{ features: Array<{ id: string; name: string; description: string }> }>)
                  .flatMap((cat) => cat.features)
                  .find((f) => f.id === featureId)
                const settings = featureSettings[featureId] || { level: 1 }
                const IconComponent = getFeatureIcon(featureId)

                if (!feature) return null

                return (
                  <div
                    key={featureId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70 border border-purple-100 dark:border-purple-800 hover:shadow-md transition-all duration-300"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getFeatureColor(featureId)} text-white shadow-sm`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {feature.name}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < settings.level
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {characterForm.preferredFeatures.length === 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Specializations Selected
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Choose specializations above to define your character&apos;s areas of expertise and personality traits.
              These will influence how your character behaves and interacts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
