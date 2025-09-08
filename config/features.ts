import { MessageSquare, Code, Palette, Target, BookOpen, Settings } from "lucide-react"
import { FeatureInfo } from "@/types/model-types"

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
