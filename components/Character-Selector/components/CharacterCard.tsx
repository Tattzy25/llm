import React from "react"
import { Edit, Trash2, Sparkles, Star, Crown, Shield, Cpu, Zap, Eye, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import type { Character } from "../types"
import { personalityArchetypes, personalityTraits, modelCategories } from "../data"

interface CharacterCardProps {
  character: Character
  selectedCharacter: string
  isAdminMode: boolean
  onCharacterSelect: (characterId: string) => void
  onEditCharacter: (character: Character) => void
  onDeleteCharacter: (characterId: string) => void
  getAllAvailableModels: () => Record<string, { name: string; maxTokens: number; endpoint: string; [key: string]: unknown }>
  getModelCategory: (modelId: string) => string
}

export function CharacterCard({
  character,
  selectedCharacter,
  isAdminMode,
  onCharacterSelect,
  onEditCharacter,
  onDeleteCharacter,
  getAllAvailableModels,
  getModelCategory
}: CharacterCardProps) {
  const IconComponent = character.icon
  const archetype = personalityArchetypes.find(a => a.id === character.archetype)
  const visualTheme = character.visualTheme || "default"

  return (
    <Card
      className={`group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] border-0 overflow-hidden relative ${
        selectedCharacter === character.id
          ? "ring-2 ring-purple-500 shadow-2xl scale-[1.02] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30"
          : "hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
      } ${visualTheme !== "default" ? `bg-gradient-to-br ${visualTheme} shadow-lg` : ""}`}
      onClick={() => onCharacterSelect(character.id)}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${character.color} shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 relative overflow-hidden`}>
              {/* Animated pulse effect */}
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse" />
              <IconComponent className="h-7 w-7 text-white relative z-10 drop-shadow-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 truncate">
                {character.name}
              </CardTitle>
              <div className="flex gap-2 flex-wrap mt-2">
                {character.isCustom ? (
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-300 shadow-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Custom
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 hover:bg-gray-50">
                    <Star className="h-3 w-3 mr-1" />
                    Preset
                  </Badge>
                )}
                {archetype && (
                  <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 shadow-sm">
                    {archetype.name.split(' ')[1] || archetype.name}
                  </Badge>
                )}
                {character.evolution && (
                  <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-300 shadow-sm">
                    <Crown className="h-3 w-3 mr-1" />
                    Lv.{character.evolution.level}
                  </Badge>
                )}
                {isAdminMode && !character.isCustom && (
                  <Badge variant="destructive" className="text-xs shadow-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {(character.isCustom || isAdminMode) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditCharacter(character)
                }}
                className="hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors duration-200"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Character</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{character.name}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteCharacter(character.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <CardDescription className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 line-clamp-2">
          {character.description}
        </CardDescription>

        {/* Personality Traits Preview */}
        {character.personality && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Personality DNA</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(character.personality)
                .filter(([, value]) => value > 60)
                .slice(0, 3)
                .map(([trait, value]) => {
                  const traitInfo = personalityTraits.find(t => t.id === trait)
                  const IconComponent = traitInfo?.icon || Sparkles
                  return (
                    <Badge key={trait} variant="secondary" className="text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <IconComponent className="h-3 w-3 mr-1" />
                      {traitInfo?.name.split(' ')[0]}: {value}%
                    </Badge>
                  )
                })}
            </div>
          </div>
        )}

        {/* Show selected models */}
        {character.models && character.models.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              AI Models
            </div>
            <div className="flex flex-wrap gap-2">
              {character.models.slice(0, 3).map(modelId => {
                const allModels = getAllAvailableModels()
                const modelConfig = allModels[modelId as keyof typeof allModels]
                const category = getModelCategory(modelId)
                const IconComponent = modelCategories[category].icon
                return (
                  <Badge key={modelId} variant="outline" className="text-xs hover:bg-purple-50 border-gray-300 text-gray-600 hover:border-purple-300 transition-colors duration-200">
                    <IconComponent className="h-3 w-3 mr-1" />
                    {modelConfig?.name || modelId}
                  </Badge>
                )
              })}
              {character.models.length > 3 && (
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                  <Plus className="h-3 w-3 mr-1" />
                  +{character.models.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Show capabilities */}
        {character.capabilities && Object.values(character.capabilities).some(Boolean) && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Superpowers
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(character.capabilities)
                .filter(([, enabled]) => enabled)
                .slice(0, 4)
                .map(([capability]) => (
                  <Badge key={capability} variant="secondary" className="text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 shadow-sm hover:shadow-md transition-shadow duration-200 animate-pulse">
                    {capability.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Badge>
                ))}
              {Object.values(character.capabilities).filter(Boolean).length > 4 && (
                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200">
                  <Plus className="h-3 w-3 mr-1" />
                  +{Object.values(character.capabilities).filter(Boolean).length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Evolution Progress */}
        {character.evolution && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold uppercase tracking-wide">Evolution</span>
              <span className="font-bold text-purple-600">{character.evolution.experience} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden shadow-inner relative">
              <div
                className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${Math.min((character.evolution.experience / 1000) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Created {new Date(character.createdAt || Date.now()).toLocaleDateString()}
          </span>
          {character.updatedAt && (
            <span className="flex items-center gap-1">
              <Edit className="h-3 w-3" />
              Updated {new Date(character.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
