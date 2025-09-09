"use client"

import * as React from 'react'
import { getMCPManager } from '@/lib/mcp/manager'

export default function HostingPanel() {
  const [loading, setLoading] = React.useState(false)
  const [summary, setSummary] = React.useState<{ total?: number; healthy?: number; unhealthy?: number; unknown?: number } | null>(null)
  const [servers, setServers] = React.useState<Array<{ id: string; active: boolean; healthy: boolean; tools: number }>>([])
  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMCPManager().getSystemHealth()
      if (res.success && res.data) {
        const d: any = res.data
        setSummary({ total: d.totalServers, healthy: Object.values(d.servers || {}).filter((s: any) => s.healthy).length, unhealthy: Object.values(d.servers || {}).filter((s: any) => !s.healthy && s.active).length, unknown: Object.values(d.servers || {}).filter((s: any) => !s.active).length })
        const list = Object.entries(d.servers || {}).map(([id, s]: any) => ({ id, active: !!s.active, healthy: !!s.healthy, tools: Number(s.tools || 0) }))
        setServers(list)
      }
    } finally { setLoading(false) }
  }, [])
  React.useEffect(() => { refresh() }, [refresh])
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hosting (Public)</h2>
        <button className="text-sm underline" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>
      {summary && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-md border"><div className="text-muted-foreground">Total</div><div className="font-medium">{summary.total}</div></div>
          <div className="p-3 rounded-md border"><div className="text-muted-foreground">Healthy</div><div className="font-medium text-emerald-600">{summary.healthy}</div></div>
          <div className="p-3 rounded-md border"><div className="text-muted-foreground">Unhealthy/Unknown</div><div className="font-medium text-amber-600">{(summary.unhealthy || 0) + (summary.unknown || 0)}</div></div>
        </div>
      )}
      <div className="rounded-md border divide-y">
        {servers.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${s.healthy ? 'bg-emerald-500' : s.active ? 'bg-amber-500' : 'bg-muted-foreground/40'}`}></span>
              <span className="font-medium">{s.id}</span>
            </div>
            <div className="text-muted-foreground">tools: {s.tools}</div>
          </div>
        ))}
        {!servers.length && <div className="p-4 text-sm text-muted-foreground">No servers reported yet.</div>}
      </div>
    </div>
  )
}
