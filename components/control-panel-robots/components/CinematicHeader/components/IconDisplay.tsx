import { Brain } from 'lucide-react'

export const IconDisplay = () => {
  return (
    <div className="flex items-center justify-center mb-4">
      <div className="relative">
        <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
        <div className="absolute inset-0 w-12 h-12 border-2 border-cyan-400 rounded-full animate-spin" style={{animationDuration: '3s'}} />
        <div className="absolute -inset-2 w-16 h-16 border border-cyan-400/30 rounded-full animate-ping" />
      </div>
    </div>
  )
}
