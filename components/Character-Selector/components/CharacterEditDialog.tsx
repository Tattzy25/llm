import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Character } from "../types"

interface CharacterEditDialogProps {
  character: Character
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (character: Character) => void
}

export function CharacterEditDialog({
  character,
  isOpen,
  onOpenChange,
  onSave
}: CharacterEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Character</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Character editing functionality will be implemented here.</p>
          <p>Character: {character.name}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(character)}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
