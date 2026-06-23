'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INFLUENCE_ACTIONS, type InfluenceActionType } from '@/lib/game-ui'
import StatusToast from './StatusToast'
import { useGamePreferences } from '@/lib/use-game-preferences'
import { trackGameEvent } from '@/lib/telemetry'

type Castaway = {
  id: number
  name: string
  status: string
}

export default function InfluencePanel({
  castaways,
  userPoints,
  isLoggedIn,
  seasonActive,
  isDemo = false,
  pendingActions = [],
}: {
  castaways: Castaway[]
  userPoints: number
  isLoggedIn: boolean
  seasonActive: boolean
  isDemo?: boolean
  pendingActions?: any[]
}) {
  const router = useRouter()
  const [action, setAction] = useState<InfluenceActionType>('gift_idol')
  const [targetA, setTargetA] = useState('')
  const [targetB, setTargetB] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const [receipt, setReceipt] = useState<{ label: string; targets: string; cost: number; remaining: number } | null>(null)
  const [currentPoints, setCurrentPoints] = useState(userPoints)
  const { markOnboardingStep } = useGamePreferences()

  const chosen = INFLUENCE_ACTIONS.find(a => a.type === action) ?? INFLUENCE_ACTIONS[0]
  const needsSecondTarget = chosen.needsSecondTarget
  const alive = castaways.filter(c => c.status === 'alive')
  const ghosts = castaways.filter(c => c.status === 'ghost')
  const targetAOptions = chosen.targetKind === 'ghost' ? ghosts : alive
  const targetBOptions = alive.filter(c => String(c.id) !== targetA)
  const selectedAName = castaways.find(c => String(c.id) === targetA)?.name
  const selectedBName = castaways.find(c => String(c.id) === targetB)?.name
  const disabledReason = isDemo
    ? 'Influence is disabled in offline preview.'
    : !seasonActive
      ? 'Influence opens only during an active season.'
      : !isLoggedIn
        ? 'Sign in to spend ratings points.'
        : currentPoints < chosen.cost
          ? 'Not enough points for this action.'
          : null

  async function submit() {
    if (disabledReason) {
      setStatus('error')
      setMsg(disabledReason)
      return
    }
    if (chosen.noTarget) {
      setTargetA('')
      setTargetB('')
    } else if (!targetA) {
      setStatus('error')
      setMsg('Pick a target first.')
      return
    } else if (needsSecondTarget && !targetB) {
      setStatus('error')
      setMsg('Pick a second target.')
      return
    }

    setStatus('loading')
    trackGameEvent('influence_submit_started', { actionType: action, cost: chosen.cost })
    const res = await fetch('/api/influence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: action,
        target_id: chosen.noTarget ? null : Number(targetA),
        target_b_id: needsSecondTarget ? Number(targetB) : null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setStatus('error')
      setMsg(data.error ?? 'influence failed')
      trackGameEvent('influence_submit_failed', { actionType: action, reason: res.status })
      return
    }

    setStatus('done')
    setMsg(`Action queued. ${data.remaining} pts remaining.`)
    setReceipt({
      label: chosen.label,
      targets: [selectedAName, selectedBName].filter(Boolean).join(' / ') || 'island',
      cost: chosen.cost,
      remaining: data.remaining ?? 0,
    })
    setCurrentPoints(data.remaining ?? Math.max(0, currentPoints - chosen.cost))
    markOnboardingStep('influence')
    trackGameEvent('influence_queued', { actionType: action, cost: chosen.cost })
    router.refresh()
  }

  return (
    <div className="ds-surface p-purple" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="hdr purple">⛧ INFLUENCE // inject noise</div>
      <div className="p-2 text-[11px]">
        <div className="c-dim mb-2">
          Spend ratings points to interfere with the season. Queued influence resolves on the next simulation tick, not instantly.
        </div>

        <>
            {pendingActions.length > 0 && (
              <div className="pending-decision-strip">{pendingActions.length} queued action{pendingActions.length === 1 ? '' : 's'} resolve next tick</div>
            )}
            <div className="flex flex-wrap gap-1 mb-2">
              {INFLUENCE_ACTIONS.map(a => (
                <button
                  key={a.type}
                  className={`btn purple text-[10px] ${action === a.type ? 'on' : ''}`}
                  onClick={() => {
                    setAction(a.type)
                    setStatus('idle')
                    setMsg('')
                    setReceipt(null)
                    trackGameEvent('influence_action_viewed', { actionType: a.type, cost: a.cost })
                  }}
                  title={a.help}
                >
                  {a.label} ({a.cost})
                </button>
              ))}
            </div>

            <div className="panel p-purple mb-2" style={{ padding: 8, borderWidth: 2 }}>
              <div className="flex justify-between gap-2">
                <span className="c-white text-[12px]">{chosen.label}</span>
                <span className="tag c-yellow">{chosen.cost} pts</span>
              </div>
              <div className="c-dim text-[10px] mt-1">{chosen.help}</div>
              <div className="c-purple text-[10px] mt-1">{chosen.effect} · resolves next tick</div>
            </div>

            <div className="grid gap-2">
              {!chosen.noTarget && (
                <label className="grid gap-1">
                  <span className="c-dim text-[10px]">{chosen.targetKind === 'ghost' ? 'GHOST SOURCE' : 'TARGET A'}</span>
                  <select value={targetA} onChange={e => setTargetA(e.target.value)}>
                    <option value="">{chosen.targetKind === 'ghost' ? 'Select a ghost' : 'Select a castaway'}</option>
                    {targetAOptions.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} [{c.status}]
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {needsSecondTarget && (
                <label className="grid gap-1">
                  <span className="c-dim text-[10px]">TARGET B</span>
                  <select value={targetB} onChange={e => setTargetB(e.target.value)}>
                    <option value="">Select second target</option>
                    {targetBOptions.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} [{c.status}]
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              {!isLoggedIn || isDemo ? (
                <a href="/login" className="btn red text-[11px]">Sign in to queue</a>
              ) : (
                <button className="btn red text-[11px]" onClick={submit} disabled={status === 'loading' || currentPoints < chosen.cost || !seasonActive}>
                  {status === 'loading' ? '...' : `Queue Influence (${chosen.cost})`}
                </button>
              )}
              <span className="c-dim text-[10px]">Balance {currentPoints} pts.</span>
            </div>

            <div className="c-dim text-[10px] mt-2">
              {!chosen.noTarget && selectedAName ? ` Target: ${selectedAName}.` : ''}
              {needsSecondTarget && selectedBName ? ` Second target: ${selectedBName}.` : ''}
              {disabledReason ? ` ${disabledReason}` : ` Remaining after queue: ${currentPoints - chosen.cost} pts. Resolves next tick.`}
            </div>

            {receipt && (
              <div className="queue-receipt">
                <div className="terminal-card-label">QUEUE RECEIPT</div>
                <div className="impact-row"><span>{receipt.label}</span><span className="c-purple">{receipt.targets}</span></div>
                <div className="impact-row"><span>Cost</span><span className="c-yellow">{receipt.cost} pts</span></div>
                <div className="impact-row"><span>Remaining</span><span className="c-green">{receipt.remaining} pts</span></div>
                <div className="c-dim text-[10px] mt-1">Resolves on the next simulation tick.</div>
              </div>
            )}

            {msg && <StatusToast tone={status === 'error' ? 'error' : 'success'} message={msg} onDismiss={() => setMsg('')} />}
          </>
      </div>
    </div>
  )
}
