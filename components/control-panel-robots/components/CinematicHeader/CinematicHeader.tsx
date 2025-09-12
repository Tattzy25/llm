"use client"

import { useVisibility } from './hooks/useVisibility'
import { BackgroundSection } from './components/BackgroundSection'
import { ContentSection } from './components/ContentSection'

// Cinematic Header Component
export const CinematicHeader = () => {
  const isVisible = useVisibility()
  
  return (
    <div className={`relative overflow-hidden transition-all duration-2000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
      <BackgroundSection />
      <ContentSection />
    </div>
  )
}
