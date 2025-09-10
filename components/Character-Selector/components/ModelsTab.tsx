import React from "react"
import { Brain, Target, Plus, X, Settings, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import type { CharacterFormData, CustomModelFormData } from "../types"
import { modelCategories } from "../data"

interface ModelsTabProps {
  characterForm: CharacterFormData
  customModelForm: CustomModelFormData
  showCustomModelForm: boolean
  onToggleModelSelection: (modelId: string) => void
  onUpdateModelSetting: (modelId: string, setting: string, value: number | boolean) => void
  onAddCustomModel: () => void
  onSetShowCustomModelForm: (show: boolean) => void
  onUpdateCustomModelForm: (field: keyof CustomModelFormData, value: string | number) => void
  getAllAvailableModels: () => Record<string, { name: string; maxTokens: number; endpoint: string; contextWindow?: number; maxFileSize?: string; provider?: string; [key: string]: unknown }>
  getModelCategory: (modelId: string) => string
  getSelectedModelsInfo: () => Array<{ id: string; config: { name: string; maxTokens: number; endpoint: string; contextWindow?: number; maxFileSize?: string; provider?: string; [key: string]: unknown }; category: string; settings?: unknown }>
}

export function ModelsTab({
  characterForm,
  customModelForm,
  showCustomModelForm,
  onToggleModelSelection,
  onUpdateModelSetting,
  onAddCustomModel,
  onSetShowCustomModelForm,
  onUpdateCustomModelForm,
  getAllAvailableModels,
  getModelCategory,
  getSelectedModelsInfo
}: ModelsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-500" />
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Models
            </h3>
            <p className="text-sm text-muted-foreground">Select the AI models your character will use</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSetShowCustomModelForm(!showCustomModelForm)}
          className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 hover:border-purple-300 transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Model
        </Button>
      </div>

      {/* Preview of BackCard style (single example) */}
      <div className="pt-2">
        <div className="inline-block">
          {/* Minimal inline version to avoid import churn */}
          <div className="w-[260px] rounded-[32px] p-[4px] bg-gradient-to-tr from-[#975af4] via-[#2f7cf8] via-[#78aafa] to-[#934cff]">
            <div className="rounded-[30px] text-white text-[12px] flex flex-col bg-[linear-gradient(140deg,#ff8a3c_0%,#ff9f3c_35%,#ffb347_60%,#ffd26f_100%)] shadow-[0_4px_18px_-4px_rgba(255,138,60,0.45)]">
              <div className="flex items-center justify-between px-[18px] py-4 bg-black/90 rounded-t-[28px]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-full bg-gradient-to-br from-orange-300 to-amber-500 flex items-center justify-center font-bold text-black text-xs border border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">GPT</div>
                  <p className="text-[14px] font-semibold truncate tracking-wide">GPT 4 Preview</p>
                </div>
                <div className="shrink-0 text-white/90">
                  <Brain className="h-5 w-5" />
                </div>
              </div>
              <div className="p-[18px] flex flex-col gap-[14px]">
                <div className="bg-black/20 border border-white/15 rounded-md p-3 text-white/90 text-[13px] leading-snug backdrop-blur-sm">
                  High capability general model. This is a preview card style.
                </div>
                <div className="grid grid-cols-1 gap-2 text-[12px]">
                  <div className="flex items-center justify-between rounded-md border border-white/25 bg-black/25 backdrop-blur-sm px-3 py-2">
                    <span className="text-white/80">Context</span>
                    <span className="text-white font-medium opacity-90">128K</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-white/25 bg-black/25 backdrop-blur-sm px-3 py-2">
                    <span className="text-white/80">Tier</span>
                    <span className="text-white font-medium opacity-90">Pro</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full rounded-md py-2 text-white text-[12px] font-semibold transition-all duration-200 active:scale-95 shadow-[inset_0_2px_4px_rgba(255,255,255,0.25)] bg-[linear-gradient(95deg,#ff8a3c,#ff9f3c_35%,#ffb347_65%,#ffd26f_100%)] hover:scale-[1.03] hover:shadow-[0_4px_14px_-2px_rgba(255,138,60,0.55)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffb347]/60"
                >
                  Use Model
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCustomModelForm && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-500" />
              Add Custom Model
            </CardTitle>
            <p className="text-sm text-muted-foreground">Configure a custom AI model for your character</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-custom-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Model Name
                </Label>
                <Input
                  id="edit-custom-name"
                  value={customModelForm.name}
                  onChange={(e) => onUpdateCustomModelForm('name', e.target.value)}
                  placeholder="e.g., My Custom GPT"
                  className="border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-custom-provider" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Provider
                </Label>
                <Input
                  id="edit-custom-provider"
                  value={customModelForm.provider}
                  onChange={(e) => onUpdateCustomModelForm('provider', e.target.value)}
                  placeholder="e.g., OpenAI, Anthropic"
                  className="border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-custom-endpoint" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                API Endpoint
              </Label>
              <Input
                id="edit-custom-endpoint"
                value={customModelForm.endpoint}
                onChange={(e) => onUpdateCustomModelForm('endpoint', e.target.value)}
                placeholder="https://api.example.com/v1/chat/completions"
                className="border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-custom-tokens" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Max Tokens
              </Label>
              <Input
                id="edit-custom-tokens"
                type="number"
                value={customModelForm.maxTokens}
                onChange={(e) => onUpdateCustomModelForm('maxTokens', parseInt(e.target.value) || 2048)}
                className="border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onAddCustomModel}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetShowCustomModelForm(false)}
                className="hover:bg-gray-50 border-gray-200 hover:border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Available Models
          </CardTitle>
          <p className="text-sm text-muted-foreground">Click to select/deselect models for your character</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-80 overflow-y-auto space-y-1 p-4">
            {Object.entries(getAllAvailableModels()).map(([modelId, config]) => {
              const category = getModelCategory(modelId)
              const isSelected = characterForm.selectedModels.includes(modelId)
              const IconComponent = modelCategories[category].icon

              return (
                <div
                  key={modelId}
                  className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 shadow-md ring-1 ring-green-200'
                      : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50/30 dark:hover:from-gray-800 dark:hover:to-purple-950/20 border-gray-100 hover:border-purple-200 hover:shadow-md'
                  }`}
                  onClick={() => onToggleModelSelection(modelId)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      isSelected
                        ? 'bg-green-100 dark:bg-green-900/40 shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30'
                    }`}>
                      <IconComponent className={`h-5 w-5 transition-colors duration-300 ${
                        isSelected ? 'text-green-600' : 'text-gray-600 group-hover:text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold transition-colors duration-300 ${
                          isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300'
                        }`}>
                          {config.name}
                        </span>
                        {isSelected && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs transition-all duration-300 ${
                          isSelected
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300 group-hover:bg-purple-100 group-hover:text-purple-700 group-hover:border-purple-300'
                        }`}>
                          {modelCategories[category].name}
                        </Badge>
                        <span className={`text-xs transition-colors duration-300 ${
                          isSelected ? 'text-green-600' : 'text-muted-foreground group-hover:text-purple-600'
                        }`}>
                          {config.maxTokens?.toLocaleString()} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 animate-in zoom-in-50 duration-300" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {characterForm.selectedModels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <Label className="text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Selected Models ({characterForm.selectedModels.length})
            </Label>
          </div>
          <div className="flex flex-wrap gap-3">
            {getSelectedModelsInfo().map(({ id, config, category }) => (
              <Badge key={id} variant="secondary" className="text-sm bg-gradient-to-r from-green-100 to-blue-100 text-green-700 border-green-300 shadow-sm hover:shadow-md transition-all duration-300 px-3 py-1">
                <span className="flex items-center gap-2">
                  {React.createElement(modelCategories[category as keyof typeof modelCategories].icon, { className: "h-4 w-4" })}
                  {config?.name || id}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {characterForm.selectedModels.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-500" />
            <Label className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Model Settings
            </Label>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {characterForm.selectedModels.map(modelId => {
              const allModels = getAllAvailableModels()
              const modelConfig = allModels[modelId as keyof typeof allModels]
              const settings = characterForm.modelSettings[modelId] || {
                temperature: 0.7,
                maxTokens: modelConfig?.maxTokens || 2048,
                enabled: true
              }

              return (
                <Card key={modelId} className="border-0 shadow-xl bg-gradient-to-br from-orange-50/50 to-purple-50/50 dark:from-orange-950/20 dark:to-purple-950/20 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-3">
                      {React.createElement(modelCategories[getModelCategory(modelId)].icon, { className: "h-5 w-5 text-orange-500" })}
                      <span className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        {modelConfig?.name || modelId}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                      <Checkbox
                        checked={settings.enabled}
                        onCheckedChange={(checked: boolean) => onUpdateModelSetting(modelId, 'enabled', checked)}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <Label className="text-sm font-medium cursor-pointer">Enable this model</Label>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Temperature
                        </Label>
                        <span className="text-sm font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                          {settings.temperature}
                        </span>
                      </div>
                      <Slider
                        value={[settings.temperature]}
                        onValueChange={([value]: number[]) => onUpdateModelSetting(modelId, 'temperature', value)}
                        max={2}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground">Controls creativity (0 = focused, 2 = very creative)</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Max Tokens
                        </Label>
                        <span className="text-sm font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                          {settings.maxTokens.toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={[settings.maxTokens]}
                        onValueChange={([value]: number[]) => onUpdateModelSetting(modelId, 'maxTokens', value)}
                        max={modelConfig?.maxTokens || 8192}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground">Maximum response length</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
