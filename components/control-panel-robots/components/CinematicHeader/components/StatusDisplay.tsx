import { Zap, Cpu } from 'lucide-react'

export const StatusDisplay = () => {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <Zap className="w-4 h-4 text-yellow-400 animate-bounce" />
      <p className="text-cyan-300 font-mono text-sm tracking-wider animate-pulse">
        AGENT CREATION PROTOCOL ACTIVE
      </p>
      <Cpu className="w-4 h-4 text-yellow-400 animate-bounce" style={{animationDelay: '0.2s'}} />
    </div>
  )
}
