// isomorphic module: safe for server and client imports

import type { MCPTool } from "../types"
import { withMCPErrorHandling, MCPServerUnavailableError } from "../utils/error-handling"

export const WEB_SCRAPING_TOOLS: MCPTool[] = [
	{
		name: 'web_scrape',
		description: 'Extract content from web pages with advanced parsing',
		category: 'web-scraping',
		serverId: 'WEB_SCRAPER',
		parameters: {
			url: { type: 'string', description: 'URL to scrape', required: true },
			selectors: { type: 'object', description: 'CSS selectors for content extraction' },
			headers: { type: 'object', description: 'Custom headers for the request' }
		},
		handler: withMCPErrorHandling(async () => {
			throw new MCPServerUnavailableError('WEB_SCRAPER', undefined, {
				hint: 'Ensure WEB_SCRAPER is configured and reachable.',
			})
		}, 'web_scrape')
	},
	{
		name: 'web_search',
		description: 'Perform intelligent web searches with filtering',
		category: 'web-scraping',
		serverId: 'WEB_SCRAPER',
		parameters: {
			query: { type: 'string', description: 'Search query', required: true },
			maxResults: { type: 'number', description: 'Maximum number of results', default: 10 },
			filters: { type: 'object', description: 'Search filters and options' }
		},
		handler: withMCPErrorHandling(async () => {
			throw new MCPServerUnavailableError('WEB_SCRAPER', undefined, {
				hint: 'Ensure WEB_SCRAPER is configured and reachable.',
			})
		}, 'web_search')
	},
	{
		name: 'content_analysis',
		description: 'Analyze web content for insights and patterns',
		category: 'web-scraping',
		serverId: 'WEB_SCRAPER',
		parameters: {
			content: { type: 'string', description: 'Content to analyze', required: true },
			analysisType: { type: 'string', description: 'Type of analysis to perform' }
		},
		handler: withMCPErrorHandling(async () => {
			throw new MCPServerUnavailableError('WEB_SCRAPER', undefined, {
				hint: 'Ensure WEB_SCRAPER is configured and reachable.',
			})
		}, 'content_analysis')
	}
]
