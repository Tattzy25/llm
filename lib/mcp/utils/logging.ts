// isomorphic minimal logger with namespacing; no console spam in production

type Level = 'debug' | 'info' | 'warn' | 'error'

const enabled = () => typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true

export function createLogger(ns: string) {
	const fmt = (level: Level, msg: string, payload?: unknown) => {
		const prefix = `[${new Date().toISOString()}][${ns}][${level.toUpperCase()}]`
		return payload !== undefined ? [prefix, msg, payload] : [prefix, msg]
	}
	return {
		debug: (msg: string, payload?: unknown) => enabled() && console.debug(...fmt('debug', msg, payload)),
		info: (msg: string, payload?: unknown) => console.info(...fmt('info', msg, payload)),
		warn: (msg: string, payload?: unknown) => console.warn(...fmt('warn', msg, payload)),
		error: (msg: string, payload?: unknown) => console.error(...fmt('error', msg, payload)),
	}
}

export type Logger = ReturnType<typeof createLogger>

