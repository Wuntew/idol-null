'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Castaway = {
  id: number
  name: string
  status: string
}

type ActionType =
  | 'gift_idol'
  | 'poison_relationship'
  | 'broadcast_rumor'
  | 'inject_anomaly'
  | 'ghost_boost'
  | 'confessional_leak'

const ACTIONS: Array<{
  type: ActionType
  label: string
  cost: number
  help: string
  outcome: string
  needsSecondTarget: boolean
}> = [
  { type: 'gift_idol', label: 'Gift Idol', cost: 150, help: 'Adds a hidden idol to a castaway.', outcome: 'Best when you want to protect a favorite from one bad vote.', needsSecondTarget: false },
  { type: 'poison_relationship', label: 'Poison Bond', cost: 75, help: 'Breaks trust between two castaways.', outcome: 'Best when you want allies to turn on each other before tribal.', needsSecondTarget: true },
  { type: 'broadcast_rumor', label: 'Broadcast Rumor', cost: 100, help: 'Spikes paranoia around one target.', outcome: 'Best when you want a stable player to become a risky vote magnet.', needsSecondTarget: false },
  { type: 'inject_anomaly', label: 'Inject Anomaly', cost: 300, help: 'Scrambles the island at random.', outcome: 'High variance. Use when you want chaos more than control.', needsSecondTarget: false },
  { type: 'ghost_boost', label: 'Ghost Boost', cost: 200, help: 'Feeds a ghost and rattles a survivor.', outcome: 'Best when the dead should keep shaping the living game.', needsSecondTarget: true },
  { type: 'confessional_leak', label: 'Leak Confessional', cost: 50, help: 'Forces the tribe to hear a plan early.', outcome: 'Cheap pressure. Best when you want to expose one target quickly.', needsSecondTarget: false },
]

export default function InfluencePanel({
  castaways,
  userPoints,
  isLoggedIn,
  seasonActive,
  isDemo = false,
}: {
  castaways: Castaway[]
  userPoints: number
  isLoggedIn: boolean
  seasonActive: boolean
  isDemo?: boolean
}) {
  const router = useRouter()
  const [action, setAction] = useState<ActionType>('gift_idol')
  const [targetA, setTargetA] = useState('')
  const [targetB, setTargetB] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const chosen = ACTIONS.find(a => a.type === action) ?? ACTIONS[0]
  const needsSecondTarget = chosen.needsSecondTarget
  const selectedAName = castaways.find(c => String(c.id) === targetA)?.name
  const selectedBName = castaways.find(c => String(c.id) === targetB)?.name
  const disabledReason = isDemo
    ? 'Influence is disabled in offline preview.'
    : !seasonActive
      ? 'Influence opens only during an active season.'
      : !isLoggedIn
        ? 'Sign in to spend ratings points.'
        : userPoints < chosen.cost
          ? 'Not enough points for this action.'
          : null

  async function submit() {
    if (disabledReason) {
      setStatus('error')
      setMsg(disabledReason)
      return
    }
    if (chosen.type === 'inject_anomaly') {
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
    const res = await fetch('/api/influence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: action,
        target_id: chosen.type === 'inject_anomaly' ? null : Number(targetA),
        target_b_id: needsSecondTarget ? Number(targetB) : null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setStatus('error')
      setMsg(data.error ?? 'influence failed')
      return
    }

    setStatus('done')
    setMsg(`Action queued. ${data.remaining} pts remaining.`)
    router.refresh()
  }

  return (
    <div className="panel p-purple" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="hdr purple">⛧ INFLUENCE // outside noise</div>
      <div className="p-2 text-[11px]">
        <div className="c-dim mb-2">
          Spend ratings points to interfere with the season. Queued influence resolves on the next simulation tick, not instantly.
        </div>

        {disabledReason && (isDemo || !seasonActive || !isLoggedIn) ? (
          <div className="c-dim">{disabledReason}</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mb-2">
              {ACTIONS.map(a => (
                <button
                  key={a.type}
                  className={`btn purple text-[10px] ${action === a.type ? 'on' : ''}`}
                  onClick={() => {
                    setAction(a.type)
                    setStatus('idle')
                    setMsg('')
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
              <div className="c-purple text-[10px] mt-1">{chosen.outcome}</div>
            </div>

            <div className="grid gap-2">
              {chosen.type !== 'inject_anomaly' && (
                <label className="grid gap-1">
                  <span className="c-dim text-[10px]">TARGET A</span>
                  <select value={targetA} onChange={e => setTargetA(e.target.value)}>
                    <option value="">Select a castaway</option>
                    {castaways.map(c => (
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
                    {castaways
                      .filter(c => String(c.id) !== targetA)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} [{c.status}]
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button className="btn red text-[11px]" onClick={submit} disabled={status === 'loading' || userPoints < chosen.cost}>
                {status === 'loading' ? '...' : `Queue Influence (${chosen.cost})`}
              </button>
              <span className="c-dim text-[10px]">You have {userPoints} pts.</span>
            </div>

            <div className="c-dim text-[10px] mt-2">
              {chosen.type !== 'inject_anomaly' && selectedAName ? ` Target: ${selectedAName}.` : ''}
              {needsSecondTarget && selectedBName ? ` Second target: ${selectedBName}.` : ''}
              {userPoints < chosen.cost ? ` ${disabledReason}` : ` Remaining after queue: ${userPoints - chosen.cost} pts.`}
            </div>

            {msg && (
              <div className={`mt-2 text-[10px] ${status === 'error' ? 'c-red' : 'c-green'}`}>
                {msg}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
