export type { MCPTool, MCPToolParameter, MCPParameterType } from './tool'
export type { MCPExecutionResult } from './common'
export type { ToolParameter } from './common'
export type { MCPConnection, MCPHealthStatus } from './server'
export type MCPConfig = {
	endpoint?: string
	httpUrl?: string
	timeout?: number
	retries?: number
	// Optional tools array for metadata only
	tools?: string[]
}
