import { FeatureInfo } from "@/types/model-types"

// Inline SVG icon components
const MessageSquare = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
)

const Code = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>
)

const Palette = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
)

const Target = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
)

const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
)

const Settings = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
)

// Feature definitions with model recommendations
export const features: FeatureInfo[] = [
  {
    id: "chat",
    name: "General Chat",
    description: "Conversational AI for everyday tasks",
    icon: MessageSquare,
    recommendedModels: ["gpt-4", "claude-sonnet-4-20250514", "llama-3.3-70b-versatile", "groq/compound"],
    useCase: "Best for natural conversations, writing assistance, and general Q&A"
  },
  {
    id: "coding",
    name: "Code Generation",
    description: "Programming and development tasks",
    icon: Code,
    recommendedModels: ["gpt-4", "claude-sonnet-4-20250514", "o3", "openai/gpt-oss-120b"],
    useCase: "Best for writing, debugging, and explaining code"
  },
  {
    id: "creative",
    name: "Creative Writing",
    description: "Storytelling and content creation",
    icon: Palette,
    recommendedModels: ["claude-sonnet-4-20250514", "gpt-4", "llama-3.3-70b-versatile", "o3"],
    useCase: "Best for creative writing, storytelling, and content generation"
  },
  {
    id: "analysis",
    name: "Data Analysis",
    description: "Research and analytical tasks",
    icon: Target,
    recommendedModels: ["gpt-4", "claude-sonnet-4-20250514", "o3", "openai/gpt-oss-120b"],
    useCase: "Best for research, analysis, and complex reasoning"
  },
  {
    id: "documentation",
    name: "Documentation",
    description: "Technical writing and documentation",
    icon: BookOpen,
    recommendedModels: ["claude-sonnet-4-20250514", "gpt-4", "o4-mini", "groq/compound-mini"],
    useCase: "Best for clear, structured technical documentation"
  },
  {
    id: "settings",
    name: "Configuration",
    description: "System configuration and setup",
    icon: Settings,
    recommendedModels: ["o4-mini", "groq/compound-mini", "llama3:70b"],
    useCase: "Best for quick configuration tasks and simple instructions"
  }
]
