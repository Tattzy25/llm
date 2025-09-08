import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomModelData } from "@/types/model-types"
import { addCustomModel } from "@/lib/chat-service"

interface CustomModelDialogProps {
  showDialog: boolean
  onOpenChange: (open: boolean) => void
  onModelAdded: () => void
}

export function CustomModelDialog({ showDialog, onOpenChange, onModelAdded }: CustomModelDialogProps) {
  const [customModelData, setCustomModelData] = React.useState<CustomModelData>({
    id: '',
    name: '',
    endpoint: '',
    maxTokens: 4096,
    provider: ''
  })

  const handleAddCustomModel = () => {
    if (customModelData.id && customModelData.name && customModelData.endpoint) {
      addCustomModel(customModelData.id, {
        name: customModelData.name,
        maxTokens: customModelData.maxTokens,
        endpoint: customModelData.endpoint,
        provider: customModelData.provider || 'Custom'
      })
      setCustomModelData({ id: '', name: '', endpoint: '', maxTokens: 4096, provider: '' })
      onOpenChange(false)
      onModelAdded()
    }
  }

  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          + Add Custom Model
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Model</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="model-id">Model ID</Label>
            <Input
              id="model-id"
              value={customModelData.id}
              onChange={(e) => setCustomModelData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="e.g., my-custom-model"
            />
          </div>
          <div>
            <Label htmlFor="model-name">Model Name</Label>
            <Input
              id="model-name"
              value={customModelData.name}
              onChange={(e) => setCustomModelData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., My Custom Model"
            />
          </div>
          <div>
            <Label htmlFor="model-endpoint">API Endpoint</Label>
            <Input
              id="model-endpoint"
              value={customModelData.endpoint}
              onChange={(e) => setCustomModelData(prev => ({ ...prev, endpoint: e.target.value }))}
              placeholder="e.g., https://api.example.com/v1/chat/completions"
            />
          </div>
          <div>
            <Label htmlFor="model-provider">Provider (Optional)</Label>
            <Input
              id="model-provider"
              value={customModelData.provider}
              onChange={(e) => setCustomModelData(prev => ({ ...prev, provider: e.target.value }))}
              placeholder="e.g., Custom Provider"
            />
          </div>
          <div>
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              value={customModelData.maxTokens}
              onChange={(e) => setCustomModelData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 }))}
            />
          </div>
          <Button onClick={handleAddCustomModel} className="w-full">
            Add Model
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
