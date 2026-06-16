'use client'
import { useState } from 'react'
import { ARCHETYPES, TRAITS } from '@/lib/simulation/data'

type CastawayRow = {
  id: number
  name: string
  archetype: string
  trait: string
  status: 'alive' | 'ghost' | 'consumed'
  condition: 'healthy' | 'starving' | 'hallucinating'
  idol_count: number
  tribe: number
  stats: { paranoia: number; gaslighting: number; likeability: number; physical: number; moxie: number }
}

const STAT_KEYS = ['paranoia', 'gaslighting', 'likeability', 'physical', 'moxie'] as const

export default function CastawayEditor({
  initialCastaways,
  seasonId,
  serviceConfigured,
}: {
  initialCastaways: CastawayRow[]
  seasonId: number | null
  serviceConfigured: boolean
}) {
  const [rows, setRows] = useState<CastawayRow[]>(initialCastaways)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  function updateRow(id: number, patch: Partial<CastawayRow>) {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  function updateStat(id: number, stat: typeof STAT_KEYS[number], value: number) {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, stats: { ...r.stats, [stat]: value } } : r)))
  }

  async function save(row: CastawayRow) {
    setSavingId(row.id); setMsg('')
    const res = await fetch(`/api/admin/castaways/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: row.name,
        archetype: row.archetype,
        trait: row.trait,
        status: row.status,
        condition: row.condition,
        idol_count: row.idol_count,
        tribe: row.tribe,
        stats: row.stats,
      }),
    })
    const data = await res.json().catch(() => ({ error: 'Invalid response.' }))
    setSavingId(null)
    setMsg(res.ok ? `Saved ${row.name}.` : data?.error ?? 'Save failed.')
  }

  if (!serviceConfigured) {
    return (
      <div className="panel p-red">
        <div className="hdr red">CASTAWAY EDITOR</div>
        <div className="c-dim text-[11px]" style={{ padding: 10 }}>Supabase service role is not configured.</div>
      </div>
    )
  }

  return (
    <div className="panel p-red">
      <div className="hdr red flex items-center justify-between gap-2">
        <span>CASTAWAY EDITOR {seasonId ? `— SEASON ${seasonId}` : ''}</span>
        {msg && <span className="c-green text-[11px]">{msg}</span>}
      </div>
      <div className="scroll" style={{ padding: 10, maxHeight: 600, overflowX: 'auto' }}>
        {rows.length === 0 ? (
          <div className="c-dim text-[11px]">No castaways found.</div>
        ) : (
          <table className="admin-table text-[11px]" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="c-dim" style={{ textAlign: 'left' }}>
                <th>Name</th><th>Archetype</th><th>Trait</th><th>Status</th><th>Condition</th>
                <th>Idols</th><th>Tribe</th>
                {STAT_KEYS.map(k => <th key={k}>{k.slice(0, 4).toUpperCase()}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} style={{ borderTop: '1px solid #1a3a1a' }}>
                  <td><input value={row.name} onChange={e => updateRow(row.id, { name: e.target.value })} style={{ width: 110 }} /></td>
                  <td>
                    <select value={row.archetype} onChange={e => updateRow(row.id, { archetype: e.target.value })}>
                      {ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={row.trait} onChange={e => updateRow(row.id, { trait: e.target.value })}>
                      {Object.keys(TRAITS).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={row.status} onChange={e => updateRow(row.id, { status: e.target.value as CastawayRow['status'] })}>
                      <option value="alive">alive</option>
                      <option value="ghost">ghost</option>
                      <option value="consumed">consumed</option>
                    </select>
                  </td>
                  <td>
                    <select value={row.condition} onChange={e => updateRow(row.id, { condition: e.target.value as CastawayRow['condition'] })}>
                      <option value="healthy">healthy</option>
                      <option value="starving">starving</option>
                      <option value="hallucinating">hallucinating</option>
                    </select>
                  </td>
                  <td><input type="number" value={row.idol_count} onChange={e => updateRow(row.id, { idol_count: Number(e.target.value) })} style={{ width: 44 }} /></td>
                  <td><input type="number" value={row.tribe} onChange={e => updateRow(row.id, { tribe: Number(e.target.value) })} style={{ width: 36 }} /></td>
                  {STAT_KEYS.map(k => (
                    <td key={k}>
                      <input
                        type="number"
                        value={row.stats[k]}
                        onChange={e => updateStat(row.id, k, Number(e.target.value))}
                        style={{ width: 50 }}
                      />
                    </td>
                  ))}
                  <td>
                    <button className="btn red" onClick={() => save(row)} disabled={savingId === row.id}>
                      {savingId === row.id ? '...' : 'SAVE'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
