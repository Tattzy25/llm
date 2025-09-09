"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Loader2, Play, XCircle } from "lucide-react"
import { getMCPManager } from "@/lib/mcp/manager"
import type { MCPExecutionResult, MCPTool, ToolParameter } from "@/lib/mcp/types"
import { showError as pushError } from "@/lib/error-bus"

export type ToolExecutionDialogProps = {
  tool: MCPTool | null
  isOpen: boolean
  onClose: () => void
}

export function ToolExecutionDialog({ tool, isOpen, onClose }: ToolExecutionDialogProps) {
  const [parameters, setParameters] = useState<Record<string, unknown>>({})
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<MCPExecutionResult | null>(null)

  const setParam = (k: string, v: unknown) => setParameters((p) => ({ ...p, [k]: v }))

  const renderInput = (name: string, cfg: ToolParameter) => {
    const val = parameters[name] ?? cfg.default ?? ""
    if (cfg.type === "boolean") {
      return (
        <Select value={String(val)} onValueChange={(v) => setParam(name, v === "true")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    if (cfg.type === "number") {
      return (
        <Input type="number" value={String(val)} onChange={(e) => setParam(name, Number(e.target.value))} placeholder={cfg.description} />
      )
    }
    if (cfg.type === "object") {
      return (
        <Textarea
          rows={4}
          value={typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)}
          onChange={(e) => {
            try { setParam(name, JSON.parse(e.target.value)) } catch { setParam(name, e.target.value) }
          }}
          placeholder={`${cfg.description ?? ""} (JSON)`}
        />
      )
    }
    return (
      <Input value={String(val)} onChange={(e) => setParam(name, e.target.value)} placeholder={cfg.description} />
    )
  }

  const handleExecute = async () => {
    if (!tool) return
    setExecuting(true)
    try {
      const mgr = getMCPManager()
      const r = await mgr.executeTool(tool.name, parameters)
      setResult(r)
      if (!r.success) pushError(r.error || `Execution failed for ${tool.name}`, `Tool: ${tool.name}`)
    } catch (e) {
      const err = String(e)
      setResult({ success: false, error: err, executionTime: Date.now() } as MCPExecutionResult)
      pushError(err, `Tool: ${tool?.name ?? "Unknown"}`)
    } finally {
      setExecuting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Execute {tool?.name}</DialogTitle>
          <DialogDescription>{tool?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {tool?.parameters && Object.entries(tool.parameters).map(([n, cfg]) => (
            <div key={n} className="space-y-2">
              <Label htmlFor={n}>
                {n}
                {(cfg as ToolParameter).required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderInput(n, cfg as ToolParameter)}
              {(cfg as ToolParameter).description && <p className="text-sm text-muted-foreground">{(cfg as ToolParameter).description}</p>}
            </div>
          ))}

          {result && (
            <div className="mt-2 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {result.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                <span className="font-medium">{result.success ? "Success" : "Error"}</span>
              </div>
              <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-40">
                {result.success ? JSON.stringify(result.data, null, 2) : result.error}
              </pre>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleExecute} disabled={executing} className="flex-1">
              {executing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Executing...</>) : (<><Play className="mr-2 h-4 w-4" /> Execute Tool</>)}
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
