// Tiny JSON-RPC client over native WebSocket (browser). No Socket.IO required.

type Pending = { resolve: (v: any) => void; reject: (e: any) => void }

export class WebSocketHandler {
	private ws: WebSocket | null = null
	private inflight = new Map<number, Pending>()
	private nextId = 1

	async connect(url: string, token?: string): Promise<void> {
		if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return
		await new Promise<void>((resolve, reject) => {
			const proto = token ? [`mcp.bearer.${token}`] : undefined
			this.ws = new WebSocket(url, proto)
			this.ws.onopen = () => resolve()
			this.ws.onerror = ev => reject(new Error(`WebSocket error: ${String((ev as any).message || ev)}`))
			this.ws.onmessage = evt => this.onMessage(evt)
			this.ws.onclose = () => this.flushAll(new Error('WebSocket closed'))
		})
	}

	close() { this.ws?.close(); this.ws = null }
	isOpen() { return !!this.ws && this.ws.readyState === WebSocket.OPEN }

	send(payload: unknown) { if (this.isOpen()) this.ws!.send(JSON.stringify(payload)) }

	request(method: string, params?: unknown): Promise<any> {
		const id = this.nextId++
		const p = new Promise<any>((resolve, reject) => this.inflight.set(id, { resolve, reject }))
		this.send({ jsonrpc: '2.0', id, method, params })
		return p
	}

	private onMessage(evt: MessageEvent) {
		try {
			const msg = JSON.parse(String(evt.data))
			if (msg && typeof msg === 'object' && 'id' in msg) {
				const pending = this.inflight.get(msg.id)
				if (pending) {
					this.inflight.delete(msg.id)
					return 'error' in msg ? pending.reject(msg.error) : pending.resolve(msg.result)
				}
			}
			// Ignore or handle notifications here if needed
		} catch { /* swallow parse errors */ }
	}

	private flushAll(err: Error) {
		this.inflight.forEach(p => p.reject(err)); this.inflight.clear()
	}
}

