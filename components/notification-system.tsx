"use client"

import * as React from "react"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  timestamp: Date
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const addNotification = React.useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [removeNotification])

  const showSuccess = React.useCallback((title: string, message?: string) => {
    addNotification({ type: 'success', title, message })
  }, [addNotification])

  const showError = React.useCallback((title: string, message?: string) => {
    addNotification({ type: 'error', title, message, duration: 0 }) // Error stays until manually dismissed
  }, [addNotification])

  const showWarning = React.useCallback((title: string, message?: string) => {
    addNotification({ type: 'warning', title, message })
  }, [addNotification])

  const showInfo = React.useCallback((title: string, message?: string) => {
    addNotification({ type: 'info', title, message })
  }, [addNotification])

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        addNotification, 
        removeNotification, 
        showSuccess, 
        showError, 
        showWarning, 
        showInfo 
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function NotificationToast({ 
  notification, 
  onClose 
}: { 
  notification: Notification
  onClose: () => void 
}) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  const Icon = icons[notification.type]

  const variants = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  }

  const iconVariants = {
    success: "text-green-600",
    error: "text-red-600", 
    warning: "text-yellow-600",
    info: "text-blue-600"
  }

  return (
    <div className={cn(
      "relative flex w-full max-w-sm items-start space-x-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
      variants[notification.type]
    )}>
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconVariants[notification.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{notification.title}</p>
        {notification.message && (
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
        title="Close notification"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
