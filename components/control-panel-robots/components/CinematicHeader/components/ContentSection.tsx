import { IconDisplay } from './IconDisplay'
import { TitleDisplay } from './TitleDisplay'
import { StatusDisplay } from './StatusDisplay'
import { Divider } from './Divider'

export const ContentSection = () => {
  return (
    <div className="relative z-10 p-8 text-center">
      <IconDisplay />
      <TitleDisplay />
      <StatusDisplay />
      <Divider />
    </div>
  )
}
