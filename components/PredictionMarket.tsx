'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isBinaryMarket, isMarketOpen, marketTypeLabel } from '@/lib/markets'

const AMOUNTS = [25, 50, 100, 250]
const WRONGNESS_THRESHOLD = 70

function entityTag(c: Castaway): string | null {
  if ((c.stats.paranoia ?? 0) < WRONGNESS_THRESHOLD) return null
  return `ENTITY_${String(c.id).padStart(2, '0')}`
}

interface Market {
  id: number; type: string; label: string; closes_at: string; day: number | null; resolved_at?: string | null
}
interface Castaway { id: number; name: string; stats: Record<string, number>; status: string }
interface UserPick { market_id: number; castaway_id: number | null; choice_bool: boolean | null; odds: number; amount: number }

export default function PredictionMarket({ market, castaways, userPoints, userPick, isLoggedIn, isDemo = false }: {
  market: Market
  castaways: Castaway[]
  userPoints: number
  userPick: UserPick | null
  isLoggedIn: boolean
  isDemo?: boolean
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<number | boolean | null>(null)
  const [amount, setAmount] = useState(25)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const isYesNo = isBinaryMarket(market.type)
  const alive = castaways.filter(c => c.status === 'alive')
  const closes = new Date(market.closes_at)
  const isOpen = isMarketOpen(market)
  const selectedLabel = selected === null
    ? null
    : isYesNo
      ? selected ? 'YES' : 'NO'
      : castaways.find(c => c.id === selected)?.name ?? 'UNKNOWN'
  const canAfford = amount <= userPoints
  const disabledReason = isDemo
    ? 'Predictions are disabled in offline preview.'
    : !isLoggedIn
      ? 'Sign in to place predictions.'
      : !isOpen
        ? 'This market is closed.'
        : !canAfford
          ? 'Not enough points for this stake.'
          : null
  const marketMeta = useMemo(() => {
    switch (market.type) {
      case 'daily_boot':
        return { badge: marketTypeLabel(market.type), hint: 'Wins if this castaway is eliminated on the next simulation day.' }
      case 'season_winner':
        return { badge: marketTypeLabel(market.type), hint: 'Wins if this castaway is the final survivor when the season ends.' }
      case 'first_boot':
        return { badge: marketTypeLabel(market.type), hint: 'Wins if this castaway is the first voted out.' }
      case 'first_consumed':
        return { badge: marketTypeLabel(market.type), hint: 'Wins if this castaway is the first consumed instead of becoming a ghost.' }
      case 'idol_played':
        return { badge: 'YES / NO', hint: 'Wins if your yes/no pick matches whether an idol is played this day.' }
      case 'anomaly_fires':
        return { badge: 'YES / NO', hint: 'Wins if your yes/no pick matches whether an anomaly fires this day.' }
      default:
        return { badge: marketTypeLabel(market.type), hint: 'Market type from the current season.' }
    }
  }, [market.type])

  async function place() {
    if (selected === null || disabledReason) {
      if (disabledReason) {
        setStatus('error')
        setMsg(disabledReason)
      }
      return
    }
    setStatus('loading')
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isYesNo
          ? { market_id: market.id, choice_bool: selected, amount }
          : { market_id: market.id, castaway_id: selected, amount }
      ),
    })
    const data = await res.json()
    if (!res.ok) { setStatus('error'); setMsg(data.error); return }
    setStatus('done'); setMsg(`Locked in. Potential: ${data.potential} pts at x${data.odds}`)
    router.refresh()
  }

  function choose(next: number | boolean) {
    setSelected(next)
    setStatus('idle')
    setMsg('')
  }

  function chooseAmount(next: number) {
    setAmount(next)
    setStatus('idle')
    setMsg('')
  }

  const daysLeft = Math.ceil((closes.getTime() - Date.now()) / 86400000)
  const closeLabel = !isOpen
    ? 'Closed'
    : market.day === null
      ? `Closes before season start (${daysLeft}d)`
      : `Closes before Day ${market.day + 1} simulation (${daysLeft}d)`

  return (
    <div className="panel mb-2 market-card">
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1 mb-1">
            <span className="tag c-amber">{marketMeta.badge}</span>
            <span className="tag c-dim">{market.day === null ? 'PRESEASON' : `DAY ${market.day}`}</span>
          </div>
          <span className="c-white text-[13px] block tracking-wide">{market.label}</span>
        </div>
        <span className="c-dim text-[10px] nowrap ml-1">{closeLabel}</span>
      </div>

      <div className="c-dim text-[10px] mb-2">{marketMeta.hint}</div>
      {!userPick && (
        <div className="flex flex-wrap gap-2 mb-2 text-[10px]">
          <span className="tag c-yellow">balance {userPoints} pts</span>
          <span className="tag c-dim">odds lock at submit</span>
        </div>
      )}

      {userPick ? (
        <div className="c-green text-[11px]">
          ✔ Staked {userPick.amount}pts on{' '}
          <b>{userPick.choice_bool === null
            ? (castaways.find(c => c.id === userPick.castaway_id)?.name ?? 'UNKNOWN')
            : (userPick.choice_bool ? 'YES' : 'NO')}</b>
          {' '}@ x{userPick.odds}
        </div>
      ) : disabledReason && selected === null ? (
        <div className="c-dim text-[10px]">
          {isDemo ? disabledReason : !isLoggedIn ? <><a href="/login" className="c-amber underline">Sign in</a> to predict.</> : disabledReason}
        </div>
      ) : (
        <>
          <div className="choice-grid mb-1">
            {isYesNo ? (
              <>
                {[{ id: true, name: 'YES' }, { id: false, name: 'NO' }].map(opt => (
                  <button key={opt.name} onClick={() => choose(opt.id)}
                    className={`btn choice-button text-[11px] ${selected === opt.id ? 'on' : ''}`}>
                    {opt.name}
                  </button>
                ))}
              </>
            ) : (
              alive.map(c => {
                const tag = entityTag(c)
                return (
                  <button key={c.id} onClick={() => choose(c.id)}
                    className={`btn choice-button text-[11px] ${selected === c.id ? 'on' : ''}`}>
                    {c.name}
                    {tag && <span className="c-wrong" style={{ marginLeft: 6 }}>{tag}</span>}
                  </button>
                )
              })
            )}
          </div>

          {selected !== null && (
            <div className="stake-row mt-2">
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => chooseAmount(a)}
                  className={`btn amber text-[11px] ${amount === a ? 'on' : ''}`}
                  disabled={a > userPoints}>
                  {a} pts
                </button>
              ))}
              <button onClick={place} disabled={status === 'loading' || !!disabledReason}
                className="btn red text-[11px] primary-lock">
                {status === 'loading' ? '...' : 'Lock Prediction'}
              </button>
            </div>
          )}

          <div className="c-dim text-[10px] mt-2">
            {selectedLabel
              ? `Selection: ${selectedLabel}. Stake: ${amount} pts. ${disabledReason ?? 'Submit to lock this prediction.'}`
              : isYesNo
                ? 'Choose yes or no, then choose a stake.'
                : 'Choose a living castaway, then choose a stake.'}
          </div>

          {msg && (
            <div className={`text-[10px] mt-1 ${status === 'error' ? 'c-red' : 'c-green'}`}>{msg}</div>
          )}
        </>
      )}
    </div>
  )
}
