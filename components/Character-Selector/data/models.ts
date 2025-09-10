import { Zap, Bot, Cpu, MessageSquare, Code, Palette, BarChart3, FileText, Mic, Eye, Search, Brain, Heart, Lightbulb, Target, Users, Sparkles, Trophy, Shield, Star } from "lucide-react"
import type { ModelCategory, FeatureDefinition, AvailableModel } from "../types"

// Model categories for organization
export const modelCategories: Record<string, ModelCategory> = {
  openai: { name: "OpenAI", icon: Zap, color: "bg-green-500" },
  anthropic: { name: "Anthropic", icon: Bot, color: "bg-orange-500" },
  groq: { name: "Groq", icon: Cpu, color: "bg-purple-500" },
  local: { name: "Local", icon: Bot, color: "bg-blue-500" },
  custom: { name: "Custom", icon: Bot, color: "bg-gray-500" }
}

// Feature categories for character capabilities
export const featureCategories: Record<string, { name: string; description: string; icon: React.ComponentType<{ className?: string }>; features: Array<{ id: string; name: string; description: string }> }> = {
  chat: { 
    name: "General Chat", 
    description: "Conversational AI for everyday tasks", 
    icon: MessageSquare,
    features: [{ id: "chat", name: "General Chat", description: "Conversational AI for everyday tasks" }]
  },
  coding: { 
    name: "Code Generation", 
    description: "Programming and development tasks", 
    icon: Code,
    features: [{ id: "coding", name: "Code Generation", description: "Programming and development tasks" }]
  },
  creative: { 
    name: "Creative Writing", 
    description: "Storytelling and content creation", 
    icon: Palette,
    features: [{ id: "creative", name: "Creative Writing", description: "Storytelling and content creation" }]
  },
  analysis: { 
    name: "Data Analysis", 
    description: "Research and analytical tasks", 
    icon: BarChart3,
    features: [{ id: "analysis", name: "Data Analysis", description: "Research and analytical tasks" }]
  },
  documentation: { 
    name: "Documentation", 
    description: "Technical writing and documentation", 
    icon: FileText,
    features: [{ id: "documentation", name: "Documentation", description: "Technical writing and documentation" }]
  },
  voice: { 
    name: "Voice/Speech", 
    description: "Text-to-speech and speech-to-text", 
    icon: Mic,
    features: [{ id: "voice", name: "Voice/Speech", description: "Text-to-speech and speech-to-text" }]
  },
  vision: { 
    name: "Image Analysis", 
    description: "Image understanding and analysis", 
    icon: Eye,
    features: [{ id: "vision", name: "Image Analysis", description: "Image understanding and analysis" }]
  },
  research: { 
    name: "Deep Research", 
    description: "Advanced research and investigation", 
    icon: Search,
    features: [{ id: "research", name: "Deep Research", description: "Advanced research and investigation" }]
  },
  memory: { 
    name: "Memory", 
    description: "Context retention and conversation history", 
    icon: Brain,
    features: [{ id: "memory", name: "Memory", description: "Context retention and conversation history" }]
  },
  empathy: { 
    name: "Empathy", 
    description: "Emotional intelligence and understanding", 
    icon: Heart,
    features: [{ id: "empathy", name: "Empathy", description: "Emotional intelligence and understanding" }]
  },
  learning: { 
    name: "Learning", 
    description: "Adaptive learning and improvement", 
    icon: Lightbulb,
    features: [{ id: "learning", name: "Learning", description: "Adaptive learning and improvement" }]
  },
  logic: { 
    name: "Logic", 
    description: "Reasoning and problem-solving", 
    icon: Target,
    features: [{ id: "logic", name: "Logic", description: "Reasoning and problem-solving" }]
  },
  social: { 
    name: "Social", 
    description: "Multi-user interactions and collaboration", 
    icon: Users,
    features: [{ id: "social", name: "Social", description: "Multi-user interactions and collaboration" }]
  }
}

// Feature definitions for model recommendations
export const featureDefinitions: Record<string, FeatureDefinition> = {
  chat: { name: "General Chat", description: "Conversational AI for everyday tasks" },
  coding: { name: "Code Generation", description: "Programming and development tasks" },
  creative: { name: "Creative Writing", description: "Storytelling and content creation" },
  analysis: { name: "Data Analysis", description: "Research and analytical tasks" },
  documentation: { name: "Documentation", description: "Technical writing and documentation" },
  voice: { name: "Voice/Speech", description: "Text-to-speech and speech-to-text" },
  vision: { name: "Image Analysis", description: "Image understanding and analysis" },
  research: { name: "Deep Research", description: "Advanced research and investigation" }
}

// Model recommendations based on features
export const modelRecommendations: Record<string, string[]> = {
  chat: ["gpt-4", "claude-sonnet-4-20250514", "llama-3.3-70b-versatile", "groq/compound"],
  coding: ["gpt-4", "claude-sonnet-4-20250514", "o3", "openai/gpt-oss-120b"],
  creative: ["claude-sonnet-4-20250514", "gpt-4", "llama-3.3-70b-versatile", "o3"],
  analysis: ["gpt-4", "claude-sonnet-4-20250514", "o3", "openai/gpt-oss-120b"],
  documentation: ["claude-sonnet-4-20250514", "gpt-4", "o4-mini", "groq/compound-mini"],
  voice: ["gpt-4o-mini-tts"],
  vision: ["gpt-4", "claude-sonnet-4-20250514"],
  research: ["gpt-4", "claude-sonnet-4-20250514", "o3", "openai/gpt-oss-120b"]
}

// Available models with their capabilities
export const availableModels: AvailableModel[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    capabilities: ["text", "code", "reasoning"]
  },
  {
    id: "gpt-4-vision",
    name: "GPT-4 Vision",
    provider: "OpenAI",
    capabilities: ["text", "code", "reasoning", "vision", "image-analysis"]
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    capabilities: ["text", "code"]
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    capabilities: ["text", "code", "reasoning"]
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    capabilities: ["text", "code", "reasoning"]
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    capabilities: ["text", "code"]
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    capabilities: ["text", "code", "reasoning"]
  },
  {
    id: "groq-llama2-70b",
    name: "Llama 2 70B",
    provider: "Groq",
    capabilities: ["text", "code"]
  },
  {
    id: "groq-mixtral-8x7b",
    name: "Mixtral 8x7B",
    provider: "Groq",
    capabilities: ["text", "code", "reasoning"]
  },
  {
    id: "groq-gemma-7b",
    name: "Gemma 7B",
    provider: "Groq",
    capabilities: ["text", "code"]
  }
]
