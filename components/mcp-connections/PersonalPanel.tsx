"use client"

import * as React from 'react'
import { getMCPManager } from '@/lib/mcp/manager'

type Action = 'start' | 'stop' | 'status'

export default function PersonalPanel() {
  const [server, setServer] = React.useState('desktop')
  const [busy, setBusy] = React.useState<Action | null>(null)
  const [output, setOutput] = React.useState<string>('')

  const run = async (action: Action) => {
    setBusy(action)
    try {
      let res
      if (action === 'start') res = await getMCPManager().executeTool('start_mcp_server', { server_name: server })
      else if (action === 'stop') res = await getMCPManager().executeTool('stop_mcp_server', { server_name: server })
      else res = await getMCPManager().executeTool('get_mcp_server_status', { server_name: server })
      setOutput(JSON.stringify(res, null, 2))
    } catch (e) {
      setOutput(String(e))
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Personal (Owner)</h2>
      <div className="flex items-center gap-2">
        <input className="border rounded px-2 py-1 text-sm" value={server} onChange={(e) => setServer(e.target.value)} placeholder="server name (e.g., desktop)" />
        <button className="text-sm px-2 py-1 rounded border" onClick={() => run('status')} disabled={!!busy}>{busy==='status'?'…':'Status'}</button>
        <button className="text-sm px-2 py-1 rounded border" onClick={() => run('start')} disabled={!!busy}>{busy==='start'?'…':'Start'}</button>
        <button className="text-sm px-2 py-1 rounded border" onClick={() => run('stop')} disabled={!!busy}>{busy==='stop'?'…':'Stop'}</button>
      </div>
      <pre className="p-3 rounded border bg-muted/30 text-xs overflow-auto max-h-72">{output || 'No output yet.'}</pre>
    </div>
  )
}
