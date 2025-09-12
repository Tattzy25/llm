import { HolographicGrid } from '../HolographicGrid'
import { ParticleField } from '../ParticleField'

export const BackgroundSection = () => {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
      <HolographicGrid />
      <ParticleField />
    </>
  )
}
