"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { CharacterSelector } from "@/components/character-selector"
import { CharacterSelectorLegacy } from "@/components/character-selector-legacy"
import { ModelSelector } from "@/components/model-selector"
import { MultiChat } from "@/components/multi-chat"
import { MCPConnectionsPage } from "@/components/mcp-connections"
import { MCPServerManager } from "@/components/mcp-server-manager"
import { MCPTools } from "@/components/mcp-tools"
import { MCPControlPanel } from "@/components/mcp-control-panel"
import { ApiKeys } from "@/components/api-keys"
import { EnvironmentVariables } from "@/components/environment-variables"
import { ControlPanelRobots } from "@/components/control-panel-robots"
import ImageConverter from "@/components/image-converter"
import { useState } from "react"
import Image from "next/image"

export default function Page() {
  const [activeView, setActiveView] = useState<"dashboard" | "partyline" | "characters" | "characters-legacy" | "models" | "mcp" | "mcp-servers" | "mcp-tools" | "mcp-control" | "api-keys" | "env-vars" | "control-panel-robots" | "image-converter">("dashboard")
  const [selectedCharacter, setSelectedCharacter] = useState("assistant")
  const [selectedModel, setSelectedModel] = useState("gpt-4")

  const handleViewChange = (view: string) => {
  const allowed = ["dashboard","partyline","characters","characters-legacy","models","mcp","mcp-servers","mcp-tools","mcp-control","api-keys","env-vars","control-panel-robots","image-converter"] as const
    if (allowed.includes(view as any)) {
      setActiveView(view as typeof activeView)
      console.log("🔄 Switching to view:", view)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar onViewChange={handleViewChange} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Image
              src="/favicon.ico"
              alt="Digital Hustle Lab Logo"
              width={32}
              height={32}
              className="rounded-md mr-2"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    {activeView === "partyline" ? "Party Line" : 
                     activeView === "characters" ? "Characters" :
                     activeView === "characters-legacy" ? "Characters Legacy" :
                     activeView === "models" ? "Models" :
                     activeView === "mcp" ? "MCP Connections" :
                     activeView === "mcp-servers" ? "MCP Servers" :
                     activeView === "mcp-tools" ? "MCP Tools" :
                     activeView === "mcp-control" ? "MCP Control Panel" :
                     activeView === "control-panel-robots" ? "Control Panel" : "Building Your Application"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {activeView === "partyline" ? "AI Chat" : 
                     activeView === "characters" ? "Select Character" :
                     activeView === "characters-legacy" ? "Select Character (Legacy)" :
                     activeView === "models" ? "Choose Model" :
                     activeView === "mcp" ? "Manage Connections" :
                     activeView === "mcp-servers" ? "Configure Servers" :
                     activeView === "mcp-tools" ? "Available Tools" :
                     activeView === "mcp-control" ? "System Control" :
                     activeView === "api-keys" ? "API Keys" :
                     activeView === "env-vars" ? "Environment Variables" :
                     activeView === "control-panel-robots" ? "Robots Management" : "Data Fetching"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <ModeToggle />
          </div>
        </header>
        {activeView === "partyline" ? (
          <MultiChat selectedCharacter={selectedCharacter} selectedModel={selectedModel} />
        ) : activeView === "characters" ? (
          <CharacterSelector 
            selectedCharacter={selectedCharacter} 
            onCharacterSelect={setSelectedCharacter} 
          />
        ) : activeView === "characters-legacy" ? (
          <CharacterSelectorLegacy 
            selectedCharacter={selectedCharacter} 
            onCharacterSelect={setSelectedCharacter} 
          />
        ) : activeView === "models" ? (
          <ModelSelector 
            selectedModel={selectedModel} 
            onModelSelect={setSelectedModel}
            currentFeature={undefined}
          />
        ) : activeView === "mcp" ? (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <MCPConnectionsPage />
          </div>
        ) : activeView === "mcp-servers" ? (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <MCPServerManager />
          </div>
        ) : activeView === "mcp-tools" ? (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <MCPTools />
          </div>
        ) : activeView === "mcp-control" ? (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <MCPControlPanel />
          </div>
        ) : activeView === "api-keys" ? (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <ApiKeys />
          </div>
        ) : activeView === "env-vars" ? (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <EnvironmentVariables />
          </div>
        ) : activeView === "control-panel-robots" ? (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <ControlPanelRobots />
          </div>
        ) : activeView === "image-converter" ? (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <ImageConverter />
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
            </div>
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
