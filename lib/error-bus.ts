"use client"

import { MCPError, normalizeToMCPError } from "@/lib/mcp/utils/error-handling"

export type ErrorItem = {
  id: string
  error: MCPError
  timestamp: Date
  context?: string
}

type Listener = (items: ErrorItem[]) => void

const state: { items: ErrorItem[]; listeners: Set<Listener> } = {
  items: [],
  listeners: new Set<Listener>()
}

function emit() {
  for (const l of state.listeners) l([...state.items])
}

export function subscribeErrors(listener: Listener) {
  state.listeners.add(listener)
  // Sync current
  listener([...state.items])
  return () => {
    state.listeners.delete(listener)
  }
}

export function getErrors(): ErrorItem[] {
  return [...state.items]
}

export function showError(error: unknown, context?: string) {
  const err = normalizeToMCPError(error, { context })
  const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
  const item: ErrorItem = { id, error: err, timestamp: new Date(), context }
  state.items = [...state.items, item]
  // Auto-dismiss: longer for network/auth
  const msg = err.message.toLowerCase()
  const timeout = /api|network|auth|server/.test(msg) ? 15000 : 8000
  setTimeout(() => dismissError(id), timeout)
  emit()
  return id
}

export function dismissError(id: string) {
  const before = state.items.length
  state.items = state.items.filter(i => i.id !== id)
  if (state.items.length !== before) emit()
}

export function clearAll() {
  if (state.items.length === 0) return
  state.items = []
  emit()
}
