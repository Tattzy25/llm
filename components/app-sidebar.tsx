"use client"

import * as React from "react"
import Image from "next/image"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Network,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Digital Hustle Lab",
      logo: () => (
        <Image
          src="/favicon.ico"
          alt="Digital Hustle Lab Logo"
          width={32}
          height={32}
          className="rounded-md"
        />
      ),
      plan: "LLM Ecosystem",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
    {
      title: "Party Line",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Chat",
          url: "#",
        },
        {
          title: "Characters",
          url: "#",
        },
        {
          title: "Characters Legacy",
          url: "#",
        },
        {
          title: "Models",
          url: "#",
        },
      ],
    },
    {
      title: "MCP",
      url: "#",
      icon: Network,
      items: [
        {
          title: "Connections",
          url: "#",
        },
        {
          title: "Servers",
          url: "#",
        },
        {
          title: "Tools",
          url: "#",
        },
        {
          title: "Control Panel",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "ENV/API KEYS",
      url: "#",
      icon: Frame,
      items: [
        {
          title: "API Keys",
          url: "#",
        },
        {
          title: "Environment Variables",
          url: "#",
        },
      ],
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Control Panel",
      url: "#",
      icon: Map,
      items: [
        {
          title: "Robots",
          url: "#",
        },
        {
          title: "Image Converter",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ onViewChange, ...props }: React.ComponentProps<typeof Sidebar> & { onViewChange?: (view: string) => void }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} onViewChange={onViewChange} />
        <NavProjects projects={data.projects} onViewChange={onViewChange} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
