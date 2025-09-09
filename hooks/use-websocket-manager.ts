import { useState, useEffect, useRef, useCallback } from 'react'

export type WebSocketState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'

export interface WebSocketConnection {
  id: string
  name: string
  url: string
  state: WebSocketState
  lastConnected?: Date
  lastMessage?: Date
  error?: string
  messageCount: number
  bytesReceived: number
  bytesSent: number
  ping?: number
}

export interface WebSocketMessage {
  id: string
  connectionId: string
  timestamp: Date
  direction: 'sent' | 'received'
  type: 'text' | 'binary'
  size: number
  preview: string
  raw?: string
}

interface UseWebSocketManagerReturn {
  connections: WebSocketConnection[]
  messages: WebSocketMessage[]
  connect: (connectionId: string) => void
  disconnect: (connectionId: string) => void
  sendMessage: (connectionId: string, message: string) => void
  addConnection: (name: string, url: string) => void
  removeConnection: (connectionId: string) => void
  clearMessages: (connectionId?: string) => void
}

export function useWebSocketManager(): UseWebSocketManagerReturn {
  const [connections, setConnections] = useState<WebSocketConnection[]>([])
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const wsRefs = useRef<Map<string, WebSocket>>(new Map())
  const pingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const reconnectTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const updateConnection = useCallback((id: string, updates: Partial<WebSocketConnection>) => {
    setConnections(prev => prev.map(conn =>
      conn.id === id ? { ...conn, ...updates } : conn
    ))
  }, [])

  const addMessage = useCallback((connectionId: string, direction: 'sent' | 'received', data: string | ArrayBuffer) => {
    const id = generateId()
    const timestamp = new Date()
    const isText = typeof data === 'string'
    const size = isText ? new Blob([data]).size : data.byteLength
    const preview = isText
      ? data.length > 100 ? data.substring(0, 100) + '...' : data
      : `Binary data (${size} bytes)`

    const message: WebSocketMessage = {
      id,
      connectionId,
      timestamp,
      direction,
      type: isText ? 'text' : 'binary',
      size,
      preview,
      raw: isText ? data : undefined
    }

    setMessages(prev => [...prev, message])

    // Update connection stats
    setConnections(prev => prev.map(conn => {
      if (conn.id === connectionId) {
        return {
          ...conn,
          messageCount: conn.messageCount + 1,
          lastMessage: timestamp,
          bytesReceived: direction === 'received' ? conn.bytesReceived + size : conn.bytesReceived,
          bytesSent: direction === 'sent' ? conn.bytesSent + size : conn.bytesSent
        }
      }
      return conn
    }))
  }, [])

  const measurePing = useCallback(async (connectionId: string, ws: WebSocket): Promise<number | undefined> => {
    return new Promise((resolve) => {
      const start = Date.now()
      const timeout = setTimeout(() => resolve(undefined), 5000)

      const pingHandler = () => {
        clearTimeout(timeout)
        const ping = Date.now() - start
        resolve(ping)
        ws.removeEventListener('message', pingHandler)
      }

      ws.addEventListener('message', pingHandler)
      ws.send(JSON.stringify({ type: 'ping', timestamp: start }))
    })
  }, [])

  const startPingInterval = useCallback((connectionId: string, ws: WebSocket) => {
    const interval = setInterval(async () => {
      const ping = await measurePing(connectionId, ws)
      if (ping !== undefined) {
        updateConnection(connectionId, { ping })
      }
    }, 30000) // Ping every 30 seconds

    pingIntervals.current.set(connectionId, interval)
  }, [measurePing, updateConnection])

  const stopPingInterval = useCallback((connectionId: string) => {
    const interval = pingIntervals.current.get(connectionId)
    if (interval) {
      clearInterval(interval)
      pingIntervals.current.delete(connectionId)
    }
  }, [])

  const connect = useCallback((connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId)
    if (!connection || connection.state === 'connecting') return

    updateConnection(connectionId, { state: 'connecting', error: undefined })

    try {
      const ws = new WebSocket(connection.url)

      ws.onopen = () => {
        console.log(`WebSocket connected: ${connection.name}`)
        wsRefs.current.set(connectionId, ws)
        updateConnection(connectionId, {
          state: 'connected',
          lastConnected: new Date(),
          error: undefined
        })
        startPingInterval(connectionId, ws)
      }

      ws.onmessage = (event) => {
        console.log(`WebSocket message received: ${connection.name}`, event.data)
        addMessage(connectionId, 'received', event.data)
      }

      ws.onclose = (event) => {
        console.log(`WebSocket closed: ${connection.name}`, event.code, event.reason)
        wsRefs.current.delete(connectionId)
        stopPingInterval(connectionId)

        if (event.code !== 1000) { // Not a normal closure
          updateConnection(connectionId, {
            state: 'error',
            error: `Connection closed: ${event.reason || 'Unknown reason'}`
          })

          // Auto-reconnect after 5 seconds
          const timeout = setTimeout(() => {
            if (connections.find(c => c.id === connectionId)?.state === 'error') {
              updateConnection(connectionId, { state: 'reconnecting' })
              connect(connectionId)
            }
          }, 5000)

          reconnectTimeouts.current.set(connectionId, timeout)
        } else {
          updateConnection(connectionId, { state: 'disconnected' })
        }
      }

      ws.onerror = (error) => {
        console.error(`WebSocket error: ${connection.name}`, error)
        updateConnection(connectionId, {
          state: 'error',
          error: 'WebSocket connection error'
        })
      }

    } catch (error) {
      console.error(`Failed to create WebSocket: ${connection.name}`, error)
      updateConnection(connectionId, {
        state: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [connections, updateConnection, startPingInterval, stopPingInterval, addMessage])

  const disconnect = useCallback((connectionId: string) => {
    const ws = wsRefs.current.get(connectionId)
    const timeout = reconnectTimeouts.current.get(connectionId)

    if (timeout) {
      clearTimeout(timeout)
      reconnectTimeouts.current.delete(connectionId)
    }

    if (ws) {
      ws.close(1000, 'User disconnected')
      wsRefs.current.delete(connectionId)
    }

    stopPingInterval(connectionId)
    updateConnection(connectionId, { state: 'disconnected' })
  }, [updateConnection, stopPingInterval])

  const sendMessage = useCallback((connectionId: string, message: string) => {
    const ws = wsRefs.current.get(connectionId)
    const connection = connections.find(c => c.id === connectionId)

    if (!ws || connection?.state !== 'connected') {
      console.warn(`Cannot send message: WebSocket not connected for ${connectionId}`)
      return
    }

    try {
      ws.send(message)
      addMessage(connectionId, 'sent', message)
      console.log(`WebSocket message sent: ${connection?.name}`, message)
    } catch (error) {
      console.error(`Failed to send message: ${connection?.name}`, error)
      updateConnection(connectionId, {
        state: 'error',
        error: 'Failed to send message'
      })
    }
  }, [connections, addMessage, updateConnection])

  const addConnection = useCallback((name: string, url: string) => {
    const id = generateId()
    const newConnection: WebSocketConnection = {
      id,
      name,
      url,
      state: 'disconnected',
      messageCount: 0,
      bytesReceived: 0,
      bytesSent: 0
    }

    setConnections(prev => [...prev, newConnection])
  }, [])

  const removeConnection = useCallback((connectionId: string) => {
    disconnect(connectionId)
    setConnections(prev => prev.filter(c => c.id !== connectionId))
    setMessages(prev => prev.filter(m => m.connectionId !== connectionId))
  }, [disconnect])

  const clearMessages = useCallback((connectionId?: string) => {
    if (connectionId) {
      setMessages(prev => prev.filter(m => m.connectionId !== connectionId))
      setConnections(prev => prev.map(c =>
        c.id === connectionId ? { ...c, messageCount: 0, bytesReceived: 0, bytesSent: 0 } : c
      ))
    } else {
      setMessages([])
      setConnections(prev => prev.map(c => ({ ...c, messageCount: 0, bytesReceived: 0, bytesSent: 0 })))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    const currentWsRefs = wsRefs.current
    const currentPingIntervals = pingIntervals.current
    const currentReconnectTimeouts = reconnectTimeouts.current

    return () => {
      currentWsRefs.forEach(ws => ws.close())
      currentPingIntervals.forEach(interval => clearInterval(interval))
      currentReconnectTimeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  return {
    connections,
    messages,
    connect,
    disconnect,
    sendMessage,
    addConnection,
    removeConnection,
    clearMessages
  }
}
