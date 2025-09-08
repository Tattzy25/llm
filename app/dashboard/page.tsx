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
import { ModelSelector } from "@/components/model-selector"
import { MultiChat } from "@/components/multi-chat"
import { useState } from "react"

export default function Page() {
  const [activeView, setActiveView] = useState<"dashboard" | "partyline" | "characters" | "models">("dashboard")
  const [selectedCharacter, setSelectedCharacter] = useState("assistant")
  const [selectedModel, setSelectedModel] = useState("gpt-4")

  const handleViewChange = (view: string) => {
    if (view === "partyline" || view === "dashboard" || view === "characters" || view === "models") {
      setActiveView(view)
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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    {activeView === "partyline" ? "Party Line" : 
                     activeView === "characters" ? "Characters" :
                     activeView === "models" ? "Models" : "Building Your Application"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {activeView === "partyline" ? "AI Chat" : 
                     activeView === "characters" ? "Select Character" :
                     activeView === "models" ? "Choose Model" : "Data Fetching"}
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
        ) : activeView === "models" ? (
          <ModelSelector 
            selectedModel={selectedModel} 
            onModelSelect={setSelectedModel} 
          />
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
