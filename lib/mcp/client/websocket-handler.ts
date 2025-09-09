"use client"

/**
 * MCP WebSocket Handler
 *
 * Handles WebSocket message parsing and event management.
 * PRODUCTION READY - ENHANCED ERROR HANDLING
 */

import { createLogger } from '../utils'

const logger = createLogger('MCP-WebSocketHandler')

export interface WebSocketMessage {
  type: string
  payload: unknown
  timestamp: number
}

export interface WebSocketEventHandlers {
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
  onOpen?: () => void
}

export class WebSocketHandler {
  /**
   * Create WebSocket connection with enhanced event handling
   */
  static createConnection(
    url: string,
    handlers: WebSocketEventHandlers = {}
  ): WebSocket {
    const ws = new WebSocket(url)

    // Enhanced message handling with JSON parsing
    if (handlers.onMessage) {
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage
          const message: WebSocketMessage = {
            ...data,
            timestamp: Date.now()
          }
          handlers.onMessage!(message)
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error as Error)
          // Send raw message if JSON parsing fails
          const rawMessage: WebSocketMessage = {
            type: 'raw',
            payload: event.data,
            timestamp: Date.now()
          }
          handlers.onMessage!(rawMessage)
        }
      }
    }

    // Enhanced error handling
    if (handlers.onError) {
      ws.onerror = (error) => {
        logger.error('WebSocket error occurred')
        handlers.onError!(error)
      }
    }

    // Enhanced close handling
    if (handlers.onClose) {
      ws.onclose = (event) => {
        logger.info(`WebSocket closed: code=${event.code}, reason=${event.reason}`)
        handlers.onClose!(event)
      }
    }

    // Connection opened
    if (handlers.onOpen) {
      ws.onopen = () => {
        logger.info('WebSocket connection opened')
        handlers.onOpen!()
      }
    }

    return ws
  }

  /**
   * Send message with error handling
   */
  static async sendMessage(ws: WebSocket, message: unknown): Promise<boolean> {
    if (ws.readyState !== WebSocket.OPEN) {
      logger.error('WebSocket is not open')
      return false
    }

    try {
      const messageString = JSON.stringify(message)
      ws.send(messageString)
      return true
    } catch (error) {
      logger.error('Failed to send WebSocket message:', error as Error)
      return false
    }
  }

  /**
   * Wait for WebSocket to be ready
   */
  static async waitForReady(ws: WebSocket, timeout: number = 10000): Promise<boolean> {
    if (ws.readyState === WebSocket.OPEN) {
      return true
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false)
      }, timeout)

      ws.onopen = () => {
        clearTimeout(timeoutId)
        resolve(true)
      }

      ws.onerror = () => {
        clearTimeout(timeoutId)
        resolve(false)
      }
    })
  }

  /**
   * Close WebSocket connection gracefully
   */
  static async closeConnection(ws: WebSocket, code: number = 1000, reason: string = ''): Promise<void> {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close(code, reason)
    }
  }

  /**
   * Get connection state description
   */
  static getConnectionState(ws: WebSocket): string {
    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'open'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'closed'
      default:
        return 'unknown'
    }
  }

  /**
   * Validate WebSocket URL
   */
  static isValidWebSocketUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
    } catch {
      return false
    }
  }
}
