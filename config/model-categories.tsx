import { ModelInfo } from "@/types/model-types"
import { MODEL_CONFIGS, CUSTOM_MODELS } from "@/lib/chat-service"
import { features } from "./features"

// Inline SVG icon components
const Bot = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
)

const Cpu = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
)

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>
)

const Globe = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
)

// Model categories configuration
export const modelCategories = {
  openai: {
    name: "OpenAI",
    icon: Zap,
    color: "bg-green-500",
    models: [] as ModelInfo[]
  },
  anthropic: {
    name: "Anthropic",
    icon: Bot,
    color: "bg-orange-500",
    models: [] as ModelInfo[]
  },
  groq: {
    name: "Groq",
    icon: Cpu,
    color: "bg-purple-500",
    models: [] as ModelInfo[]
  },
  local: {
    name: "Local Models",
    icon: Globe,
    color: "bg-blue-500",
    models: [] as ModelInfo[]
  },
  custom: {
    name: "Custom",
    icon: Bot,
    color: "bg-gray-500",
    models: [] as ModelInfo[]
  }
}

// Model strengths and recommendations mapping
export const modelStrengths: Record<string, string[]> = {
  "gpt-4": ["Excellent reasoning", "Code generation", "Creative writing", "Complex analysis"],
  "gpt-4.1": ["Advanced reasoning", "Multilingual", "Creative tasks", "Research"],
  "gpt-5-2025-08-07": ["Cutting-edge AI", "Advanced reasoning", "Multimodal", "Research"],
  "o3": ["Optimized performance", "Fast responses", "Technical tasks", "Analysis"],
  "o4-mini": ["Efficient and fast", "Cost-effective", "Simple tasks", "Quick responses"],
  "claude-sonnet-4-20250514": ["Balanced performance", "Technical writing", "Analysis", "Documentation"],
  "openai/gpt-oss-120b": ["Large context window", "Code generation", "Research", "Analysis"],
  "openai/gpt-oss-20b": ["Balanced performance", "General tasks", "Cost-effective", "Fast"],
  "llama-3.3-70b-versatile": ["Open source", "Customizable", "General purpose", "Cost-effective"],
  "groq/compound": ["Fast inference", "Compound AI", "General tasks", "Efficient"],
  "groq/compound-mini": ["Ultra-fast", "Lightweight", "Simple tasks", "Cost-effective"],
  "meta-llama/llama-4-maverick-17b-128e-instruct": ["Advanced reasoning", "Multilingual", "Creative tasks", "Research"],
  "meta-llama/llama-4-scout-17b-16e-instruct": ["Efficient processing", "General tasks", "Fast responses", "Balanced"],
  "relayavi/ollamik": ["Custom Ollama", "Local deployment", "Privacy-focused", "Flexible"],
  "gpt-oss-20b": ["Large context", "Local deployment", "Privacy-focused", "Cost-effective"],
  "gpt-oss-120b": ["Maximum context", "Local deployment", "Research-grade", "Powerful"],
  "deepseek-r1:671b": ["Deep reasoning", "Large model", "Research", "Complex tasks"],
  "gemma3:27b": ["Google's Gemma", "Balanced performance", "General tasks", "Efficient"],
  "llama3:70b": ["Meta's Llama 3", "Large context", "Versatile", "Powerful"]
}

// Convert MODEL_CONFIGS to categorized format with recommendations
Object.entries(MODEL_CONFIGS).forEach(([key, config]) => {
  let category: keyof typeof modelCategories = 'custom'
  let provider = 'Custom'

  if (key.startsWith('gpt-') || key.startsWith('o')) {
    category = 'openai'
    provider = 'OpenAI'
  } else if (key.startsWith('claude-')) {
    category = 'anthropic'
    provider = 'Anthropic'
  } else if (key.includes('groq') || key.startsWith('llama-') || key.startsWith('meta-llama') || key.startsWith('openai/gpt-oss') || key.startsWith('deepseek') || key.startsWith('gemma')) {
    category = 'groq'
    provider = 'Groq'
  } else if (key.includes('local') || key === 'llama3:70b' || key === 'gpt-oss-20b' || key === 'gpt-oss-120b') {
    category = 'local'
    provider = 'Local'
  }

  // Determine recommended features for this model
  const recommendedFor: string[] = []
  features.forEach(feature => {
    if (feature.recommendedModels.includes(key)) {
      recommendedFor.push(feature.id)
    }
  })

  const modelInfo: ModelInfo = {
    id: key,
    name: config.name,
    provider,
    category,
    maxTokens: config.maxTokens,
    contextWindow: 'contextWindow' in config ? config.contextWindow : config.maxTokens,
    description: `${provider} model with ${config.maxTokens.toLocaleString()} max tokens`,
    icon: modelCategories[category].icon,
    color: modelCategories[category].color,
    recommendedFor,
    strengths: modelStrengths[key] || ["General purpose AI", "Versatile applications"]
  }

  modelCategories[category].models.push(modelInfo)
})

// Add custom models to the custom category
Object.entries(CUSTOM_MODELS).forEach(([key, config]) => {
  const modelInfo: ModelInfo = {
    id: key,
    name: config.name,
    provider: config.provider || 'Custom',
    category: 'custom',
    maxTokens: config.maxTokens,
    contextWindow: config.contextWindow || config.maxTokens,
    description: `${config.provider || 'Custom'} model with ${config.maxTokens.toLocaleString()} max tokens`,
    icon: modelCategories.custom.icon,
    color: modelCategories.custom.color,
    recommendedFor: [],
    strengths: ["Custom model", "User-defined"]
  }

  modelCategories.custom.models.push(modelInfo)
})
