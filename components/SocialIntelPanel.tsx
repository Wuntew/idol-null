'use client'

import { useMemo, useState } from 'react'
import StatusToast from './StatusToast'

const QUESTIONS = [
  { key: 'plan', label: 'What is your plan?' },
  { key: 'trust', label: 'Who do you trust?' },
  { key: 'threat', label: 'Who threatens you?' },
  { key: 'regret', label: 'What do you regret?' },
]

export default function SocialIntelPanel({ castaways, events = [], latestSummary, user, isDemo, initialFocus, initialQuestion, compact = false }: any) {
  const alive = castaways.filter((row: any) => row.status === 'alive')
  const [focusId, setFocusId] = useState<number | null>(initialFocus?.castaway_id ?? alive[0]?.id ?? null)
  const [question, setQuestion] = useState<any>(initialQuestion ?? null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const names = useMemo(() => Object.fromEntries(castaways.map((row: any) => [String(row.id), row.name])), [castaways])
  const focused = alive.find((row: any) => row.id === focusId)
  const votes = latestSummary?.summary_data?.voteDecisions ?? []

  async function saveFocus(nextId: number) {
    setFocusId(nextId)
    if (!user || isDemo) return
    const response = await fetch('/api/focus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ castaway_id: nextId }) })
    if (!response.ok) setToast({ message: (await response.json()).error ?? 'Could not set focus.', tone: 'error' })
  }

  async function ask(promptKey: string) {
    if (!focusId || busy || question) return
    setBusy(true)
    const response = await fetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ castaway_id: focusId, prompt_key: promptKey }) })
    const data = await response.json()
    setBusy(false)
    if (!response.ok) return setToast({ message: data.error ?? 'Question failed.', tone: 'error' })
    setQuestion(data)
    setToast({ message: 'Signal answer recorded for today.', tone: 'success' })
  }

  return (
    <section className={`social-intel ds-surface p-cyan ${compact ? 'social-intel-compact' : ''}`} aria-label="Social intelligence">
      <div className="hdr cyan">SOCIAL INTELLIGENCE</div>
      <div className="social-intel-body">
        <div className="terminal-card-label">SURVEILLANCE FOCUS</div>
        <select value={focusId ?? ''} onChange={event => saveFocus(Number(event.target.value))} aria-label="Choose castaway surveillance focus" disabled={!alive.length}>
          {alive.map((row: any) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
        {focused?.social_state?.intent && (
          <div className="social-intel-read"><span className="status-chip status-chip-cyan">{String(focused.social_state.intent.type).replaceAll('_', ' ')}</span><span>{focused.social_state.intent.reason}</span></div>
        )}

        <div className="terminal-card-label social-intel-heading">ASK THE SIGNAL</div>
        {!user || isDemo ? <div className="c-dim">Sign in to ask one castaway question per simulation day.</div> : question ? (
          <div className="signal-answer"><strong>{names[String(question.castaway_id)] ?? 'Castaway'}</strong><span>{question.answer}</span></div>
        ) : (
          <div className="signal-question-grid">{QUESTIONS.map(item => <button key={item.key} type="button" onClick={() => ask(item.key)} disabled={busy || !focusId}>{item.label}</button>)}</div>
        )}

        {!!votes.length && (
          <div className="social-intel-section">
            <div className="terminal-card-label">VOTE AUTOPSY</div>
            {votes.slice(0, compact ? 4 : 8).map((vote: any) => <div className="social-intel-row" key={`${vote.voterId}-${vote.targetId}`}><span>{names[String(vote.voterId)]} → {names[String(vote.targetId)]}</span><span className={vote.reason === 'betrayal' ? 'c-red' : 'c-dim'}>{String(vote.reason).replaceAll('_', ' ')} · {vote.confidence}%</span></div>)}
          </div>
        )}

        {!!events.length && (
          <div className="social-intel-section">
            <div className="terminal-card-label">RELATIONSHIP TIMELINE</div>
            {events.slice(0, compact ? 3 : 6).map((event: any) => <div className="social-intel-event" key={event.id ?? event.event_key}><span className="c-dim">D{event.day} · {event.phase}</span><span>{event.text}</span></div>)}
          </div>
        )}
      </div>
      {toast && <StatusToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </section>
  )
}
