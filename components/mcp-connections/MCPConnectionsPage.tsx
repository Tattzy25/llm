"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Database, Bot, Settings, Wrench, Search, Play } from "lucide-react"
import { ALL_MCP_TOOLS } from "@/lib/mcp/tools/index"
import type { MCPTool } from "@/lib/mcp/types"
import { ToolExecutionDialog } from "./ToolExecutionDialog"

const catIcon = (c?: string) => {
	switch (c) {
		case "web-scraping": return <Globe className="h-5 w-5" />
		case "database": return <Database className="h-5 w-5" />
		case "ai": return <Bot className="h-5 w-5" />
		case "management": return <Settings className="h-5 w-5" />
		case "desktop": return <Wrench className="h-5 w-5" />
		case "filesystem": return <Search className="h-5 w-5" />
		default: return <Wrench className="h-5 w-5" />
	}
}
const catColor = (c?: string) => {
	const colors: Record<string, string> = {
		"web-scraping": "bg-blue-500",
		database: "bg-green-500",
		ai: "bg-purple-500",
		management: "bg-orange-500",
		desktop: "bg-cyan-500",
		filesystem: "bg-indigo-500",
	}
	return (c ? colors[c] : undefined) ?? "bg-gray-500"
}

export function MCPConnectionsPage() {
	const [q, setQ] = useState("")
	const [cat, setCat] = useState("all")
	const [tool, setTool] = useState<MCPTool | null>(null)
	const [open, setOpen] = useState(false)

	const filtered = ALL_MCP_TOOLS.filter(t => {
		const mQ = t.name.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase())
		const mC = cat === "all" || t.category === cat
		return mQ && mC
	})

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">MCP Tools</h2>
					<p className="text-muted-foreground">Discover and execute Model Context Protocol tools</p>
				</div>
			</div>

			<div className="flex gap-4">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input placeholder="Search tools..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
					</div>
				</div>
				<Select value={cat} onValueChange={setCat}>
					<SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						<SelectItem value="web-scraping">Web Scraping</SelectItem>
						<SelectItem value="database">Database</SelectItem>
						<SelectItem value="ai">AI Assistant</SelectItem>
						<SelectItem value="management">Management</SelectItem>
						<SelectItem value="desktop">Desktop</SelectItem>
						<SelectItem value="filesystem">File System</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{filtered.map((t) => (
					<Card key={t.name} className="hover:shadow-lg transition-shadow">
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div className={`p-2 rounded-lg ${catColor(t.category)}`}>{catIcon(t.category)}</div>
									<div>
										<CardTitle className="text-lg">{t.name}</CardTitle>
										<Badge variant="secondary" className="mt-1">{t.category || "general"}</Badge>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<CardDescription className="mb-4">{t.description}</CardDescription>
							<div className="space-y-3">
								<div className="text-sm text-muted-foreground"><strong>Server:</strong> {t.serverId}</div>
								{t.parameters && Object.keys(t.parameters).length > 0 && (
									<div className="text-sm text-muted-foreground">
										<strong>Parameters:</strong> {Object.keys(t.parameters).length} required
									</div>
								)}
								<Button size="sm" className="w-full" onClick={() => { setTool(t); setOpen(true) }}>
									<Play className="mr-2 h-4 w-4" /> Execute Tool
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{filtered.length === 0 && (
				<div className="text-center py-12">
					<Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium mb-2">No tools found</h3>
					<p className="text-muted-foreground">Try adjusting your search or category filter</p>
				</div>
			)}

			{tool && (
				<ToolExecutionDialog tool={tool} isOpen={open} onClose={() => { setOpen(false); setTool(null) }} />
			)}
		</div>
	)
}

