'use client'
import { useState } from 'react'

export default function SeasonControlPanel() {
  const [loading, setLoading] = useState<'tick' | 'restart' | 'dossier' | null>(null)
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
            {loading === 'dossier' ? '// generating...' : '📋 BACKFILL DOSSIERS'}
          </button>
        </div>
        <div className="c-dim text-[11px]">
          Run Tick Now advances the simulation exactly like the daily cron job (same endpoint, same CRON_SECRET).
          Force New Season ends the active/preseason season with no winner recorded, then bootstraps a fresh one.
          Backfill Dossiers generates AI dossiers for all castaways in a season that are missing one (uses DeepSeek).
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
