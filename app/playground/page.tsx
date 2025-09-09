"use client"

import dynamic from 'next/dynamic';

// Dynamically import the MCP Playground component to avoid SSR issues
const MCPPlayground = dynamic(() => import('@/components/MCPPlayground'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading MCP Playground...</p>
      </div>
    </div>
  )
});

export default function PlaygroundPage() {
  return (
    <div className="h-screen">
      <MCPPlayground />
    </div>
  );
}
