'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Bot, Sparkles, Zap, MessageSquare, Settings, Database } from 'lucide-react';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
            <Bot className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Digital Hustle Lab
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Multi-provider LLM interface with character personas, MCP integration, and advanced AI capabilities
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle>Multiple AI Models</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect to OpenAI, Anthropic, Groq, Google AI, and local models. Switch between providers seamlessly.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <CardTitle>Character System</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create AI personas with custom personalities, capabilities, and system prompts for specialized tasks.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <CardTitle>MCP Integration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Model Context Protocol servers for desktop integration, file access, and custom tool execution.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Bot className="mr-2 h-5 w-5" />
              Open Dashboard
            </Button>
          </Link>
          <Link href="/playground">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Zap className="mr-2 h-5 w-5" />
              MCP Playground
            </Button>
          </Link>
          <Link href="/api-key">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Settings className="mr-2 h-5 w-5" />
              API Settings
            </Button>
          </Link>
        </div>

        {/* Status Info */}
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-slate-700 dark:text-slate-300">
                  Build: <span className="font-semibold text-green-600 dark:text-green-400">Passing</span>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-slate-700 dark:text-slate-300">
                  Framework: <span className="font-semibold">Next.js 15.5.2</span>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-slate-700 dark:text-slate-300">
                  Status: <span className="font-semibold text-green-600 dark:text-green-400">Ready to Deploy</span>
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Need help? Check the{' '}
            <Link href="/README.md" className="text-blue-600 hover:underline">
              README
            </Link>
            {' '}or{' '}
            <Link href="/DEPLOYMENT.md" className="text-blue-600 hover:underline">
              Deployment Guide
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
