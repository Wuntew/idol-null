'use client'
import { useState } from 'react'

export default function SeasonControlPanel() {
  const [loading, setLoading] = useState<'tick' | 'restart' | 'dossier' | 'rivals' | 'pool' | null>(null)
  const [result, setResult] = useState('')

  async function runTick() {
    setLoading('tick'); setResult('')
    const res = await fetch('/api/admin/season/tick', { method: 'POST' })
    const data = await res.json().catch(() => ({ error: 'Invalid response.' }))
    setResult(JSON.stringify(data, null, 2))
    setLoading(null)
  }

  async function forceNewSeason() {
    if (!confirm('This ends the current season immediately with no winner and starts a fresh one. Continue?')) return
    setLoading('restart'); setResult('')
    const res = await fetch('/api/admin/season/restart', { method: 'POST' })
    const data = await res.json().catch(() => ({ error: 'Invalid response.' }))
    setResult(JSON.stringify(data, null, 2))
    setLoading(null)
  }

  async function backfillRivals() {
    const seasonId = prompt('Season ID to generate rival dynamics for?', '6')
    if (!seasonId) return
    setLoading('rivals'); setResult('')
    const res = await fetch(`/api/admin/season/backfill-rivals?season_id=${encodeURIComponent(seasonId)}`, { method: 'POST' })
    const data = await res.json().catch(() => ({ error: 'Invalid response.' }))
    setResult(JSON.stringify(data, null, 2))
    setLoading(null)
  }

  async function backfillPoolTapes() {
    if (!confirm('Generate AI audition tapes for all pool entries missing one? This may take a while.')) return
    setLoading('pool'); setResult('')
    const res = await fetch('/api/admin/pool/backfill-tapes', { method: 'POST' })
    const data = await res.json().catch(() => ({ error: 'Invalid response.' }))
    setResult(JSON.stringify(data, null, 2))
    setLoading(null)
  }

  async function backfillDossiers() {
    const seasonId = prompt('Season ID to backfill dossiers for?', '6')
    if (!seasonId) return
    setLoading('dossier'); setResult('')
    const res = await fetch(`/api/admin/season/backfill-dossiers?season_id=${encodeURIComponent(seasonId)}`, { method: 'POST' })
    const data = await res.json().catch(() => ({ error: 'Invalid response.' }))
    setResult(JSON.stringify(data, null, 2))
    setLoading(null)
  }

  return (
    <div className="panel p-red">
      <div className="hdr red">SEASON CONTROL</div>
      <div className="flex flex-col gap-3" style={{ padding: 10 }}>
        <div className="flex gap-2 flex-wrap">
          <button className="btn red" onClick={runTick} disabled={loading !== null}>
            {loading === 'tick' ? '// running...' : '▶ RUN TICK NOW'}
          </button>
          <button className="btn red" onClick={forceNewSeason} disabled={loading !== null}>
            {loading === 'restart' ? '// restarting...' : '⏻ FORCE NEW SEASON'}
          </button>
          <button className="btn red" onClick={backfillDossiers} disabled={loading !== null}>
            {loading === 'dossier' ? '// generating...' : 'BACKFILL DOSSIERS'}
          </button>
          <button className="btn red" onClick={backfillRivals} disabled={loading !== null}>
            {loading === 'rivals' ? '// generating...' : 'RIVAL DYNAMICS'}
          </button>
          <button className="btn red" onClick={backfillPoolTapes} disabled={loading !== null}>
            {loading === 'pool' ? '// generating...' : 'POOL TAPES'}
          </button>
        </div>
        <div className="c-dim text-[11px]">
          Run Tick: advances simulation like daily cron.
          Force New Season: ends current season, bootstraps fresh one.
          Backfill Dossiers: AI dossiers for castaways missing one.
          Rival Dynamics: generates ally/enemy write-ups from current relationship scores.
          Pool Tapes: AI audition tapes for pool entries missing one.
        </div>
        {result && (
          <pre
            className="scroll text-[11px]"
            style={{ maxHeight: 280, padding: 8, background: '#000', border: '1px solid #1a3a1a', whiteSpace: 'pre-wrap' }}
          >
            {result}
          </pre>
        )}
      </div>
    </div>
  )
}
