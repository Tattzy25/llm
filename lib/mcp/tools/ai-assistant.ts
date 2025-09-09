"use client"

import type { MCPTool } from "../types"
import { withMCPErrorHandling, MCPServerUnavailableError } from "../utils/error-handling"

export const AI_ASSISTANT_TOOLS: MCPTool[] = [
	{
		name: 'content_generator',
		description: 'Generate content using multiple AI models',
		category: 'ai',
		serverId: 'AI_ASSISTANT',
		parameters: {
			prompt: { type: 'string', description: 'Content generation prompt', required: true },
			model: { type: 'string', description: 'AI model to use', default: 'gpt-4' },
			options: { type: 'object', description: 'Generation options and parameters' }
		},
		handler: withMCPErrorHandling(async () => {
			throw new MCPServerUnavailableError('AI_ASSISTANT', undefined, { hint: 'Start AI_ASSISTANT server and set model keys.' })
		}, 'content_generator')
	},
	{
		name: 'code_analyzer',
		description: 'Analyze and improve code quality',
		category: 'ai',
		serverId: 'AI_ASSISTANT',
		parameters: {
			code: { type: 'string', description: 'Code to analyze', required: true },
			language: { type: 'string', description: 'Programming language', required: true },
			analysisType: { type: 'string', description: 'Type of analysis (lint, complexity, security)' }
		},
		handler: withMCPErrorHandling(async () => {
			throw new MCPServerUnavailableError('AI_ASSISTANT', undefined, { hint: 'Start AI_ASSISTANT server and set model keys.' })
		}, 'code_analyzer')
	},
	{
		name: 'data_analyzer',
		description: 'Process and analyze datasets with ML capabilities',
		category: 'ai',
		serverId: 'AI_ASSISTANT',
		parameters: {
			data: { type: 'object', description: 'Dataset to analyze', required: true },
			analysisType: { type: 'string', description: 'Type of analysis (statistics, ml, visualization)', required: true },
			options: { type: 'object', description: 'Analysis options and parameters' }
		},
		handler: withMCPErrorHandling(async () => {
			throw new MCPServerUnavailableError('AI_ASSISTANT', undefined, { hint: 'Start AI_ASSISTANT server and set model keys.' })
		}, 'data_analyzer')
	}
]
