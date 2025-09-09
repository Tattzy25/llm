import type { MCPToolParameter } from '../types/tool'

type Schema = Record<string, MCPToolParameter>

export function validateToolParameters(
	params: Record<string, unknown>,
	schema: Schema
): { valid: true } | { valid: false; errors: string[] } {
	const errors: string[] = []
		const p: Record<string, unknown> = params
		for (const [key, def] of Object.entries(schema)) {
			const val = p[key]
		if (def.required && (val === undefined || val === null || val === '')) {
			errors.push(`Missing required parameter '${key}'`)
			continue
		}
		if (val === undefined || val === null) continue
		const t = typeof val
		switch (def.type) {
			case 'string':
				if (t !== 'string') errors.push(`'${key}' must be string`)
				break
			case 'number':
				if (t !== 'number' || Number.isNaN(val as number)) errors.push(`'${key}' must be number`)
				break
			case 'boolean':
				if (t !== 'boolean') errors.push(`'${key}' must be boolean`)
				break
			case 'object':
				if (t !== 'object' || Array.isArray(val)) errors.push(`'${key}' must be object`)
				break
			default:
				errors.push(`Unknown type for '${key}'`)
		}
	}
	return errors.length ? { valid: false, errors } : { valid: true }
}

