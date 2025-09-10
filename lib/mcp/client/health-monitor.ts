import type { MCPHealthStatus } from '../types/server'

export class HealthMonitor {
  private statuses = new Map<string, MCPHealthStatus>()
  private timer: ReturnType<typeof setInterval> | null = null
  private retryCount = 0
  private maxRetries = 3

  async checkHealth(serverId: string, httpUrl: string): Promise<MCPHealthStatus> {
    const start = Date.now()
    try {
      const res = await fetch('/api/mcp/tools/get_system_health/execute', { method: 'POST' })
      const ok = res.ok
      const status: MCPHealthStatus = {
        serverId,
        status: ok ? 'healthy' : 'unhealthy',
        lastChecked: new Date(),
        responseTimeMs: Date.now() - start,
        error: ok ? undefined : `HTTP ${res.status}`
      }
      this.statuses.set(serverId, status)
      this.retryCount = 0 // Reset on success
      return status
    } catch (e) {
      this.retryCount++
      console.warn(`Health check failed (${this.retryCount}/${this.maxRetries}):`, e)

      if (this.retryCount >= this.maxRetries) {
        console.warn('Max retries reached, disabling health monitor')
        if (this.timer) clearInterval(this.timer)
        this.timer = null
      }

      const status: MCPHealthStatus = {
        serverId,
        status: 'unknown',
        lastChecked: new Date(),
        error: e instanceof Error ? e.message : String(e),
      }
      this.statuses.set(serverId, status)
      return status
    }
  }

  startHealthChecks(serverIds: string[], httpUrls: Map<string, string>, intervalMs: number): void {
    if (this.timer) clearInterval(this.timer)
    const tick = () => {
      if (this.retryCount >= this.maxRetries) {
        console.warn('Max retries reached, stopping health checks')
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        return
      }
      serverIds.forEach(id => this.checkHealth(id, httpUrls.get(id) || ''))
    }
    tick()
    this.timer = setInterval(tick, intervalMs)
  }

  getAllHealthStatuses(): MCPHealthStatus[] { return Array.from(this.statuses.values()) }
  getHealthStatus(serverId: string): MCPHealthStatus | undefined { return this.statuses.get(serverId) }
  clearHealthStatus(serverId: string): void { this.statuses.delete(serverId) }
  cleanup(): void { if (this.timer) clearInterval(this.timer); this.statuses.clear() }

  getHealthSummary() {
    const list = this.getAllHealthStatuses()
    const total = list.length
    const healthy = list.filter(s => s.status === 'healthy').length
    const unhealthy = list.filter(s => s.status === 'unhealthy').length
    const unknown = list.filter(s => s.status === 'unknown').length
    const avg = list.reduce((acc, s) => acc + (s.responseTimeMs || 0), 0) / (total || 1)
    return { total, healthy, unhealthy, unknown, averageResponseTime: avg }
  }
}

