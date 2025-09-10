import { Lightbulb, Brain, Heart, Sparkles, Briefcase, Flame } from "lucide-react"
import type { PersonalityTrait } from "../types"

// Personality Traits Configuration
export const personalityTraits: PersonalityTrait[] = [
  {
    id: "creativity",
    name: "Creativity",
    description: "How imaginative and original the character is",
    icon: Lightbulb,
    color: "text-yellow-500"
  },
  {
    id: "analytical",
    name: "Analytical Thinking",
    description: "How logical and systematic the character's reasoning is",
    icon: Brain,
    color: "text-blue-500"
  },
  {
    id: "empathy",
    name: "Empathy",
    description: "How well the character understands and relates to others",
    icon: Heart,
    color: "text-pink-500"
  },
  {
    id: "humor",
    name: "Humor Level",
    description: "How witty and light-hearted the character is",
    icon: Sparkles,
    color: "text-purple-500"
  },
  {
    id: "formality",
    name: "Formality",
    description: "How formal vs casual the character's communication style is",
    icon: Briefcase,
    color: "text-gray-600"
  },
  {
    id: "riskTolerance",
    name: "Risk Tolerance",
    description: "How willing the character is to take calculated risks",
    icon: Flame,
    color: "text-orange-500"
  }
]
