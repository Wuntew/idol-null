'use client'
import { useState } from 'react'
import { ARCHETYPES, TRAITS } from '@/lib/simulation/data'

type CastawayOption = {
  id: number
  name: string
  trait: string
  archetype: string
  age: number | null
  hometown: string | null
  job: string | null
  education: string | null
  family: string | null
}

type FormState = {
  name: string
  trait: string
  archetype: string
  age: number
  hometown: string
  job: string
  education: string
  family: string
}

const BLANK: FormState = {
  name: '',
  trait: Object.keys(TRAITS)[0],
  archetype: ARCHETYPES[0],
  age: 30,
  hometown: '',
  job: '',
  education: '',
  family: '',
}

export default function AuditionTapeLab({
  castaways,
  openaiConfigured,
}: {
  castaways: CastawayOption[]
  openaiConfigured: boolean
}) {
  const [form, setForm] = useState<FormState>(BLANK)
  const [loading, setLoading] = useState(false)
  const [tape, setTape] = useState<string | null>(null)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function prefill(id: string) {
    const c = castaways.find(c => c.id === Number(id))
    if (!c) return
    setForm({
      name: c.name,
      trait: c.trait,
      archetype: c.archetype,
      age: c.age ?? 30,
      hometown: c.hometown ?? '',
      job: c.job ?? '',
      education: c.education ?? '',
      family: c.family ?? '',
    })
  }

  async function generate() {
    setLoading(true); setError(''); setTape(null)
    const res = await fetch('/api/admin/ai/audition-tape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => null)
    setLoading(false)
    if (!res.ok || !data) { setError(data?.error ?? 'Generation failed.'); return }
    setTape(data.tape)
    if (!data.tape) setError('No tape returned — check OPENAI_API_KEY, or the pool-based fallback will be used in-game.')
  }

  return (
    <div className="panel p-red">
      <div className="hdr red flex items-center justify-between gap-2">
        <span>AI LAB — AUDITION TAPE</span>
        <span className={openaiConfigured ? 'c-green text-[11px]' : 'c-amber text-[11px]'}>
          {openaiConfigured ? 'OPENAI_API_KEY set' : 'OPENAI_API_KEY missing'}
        </span>
      </div>
      <div className="flex flex-col gap-3" style={{ padding: 10 }}>
        {castaways.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="c-dim text-[11px]">PREFILL FROM</label>
            <select defaultValue="" onChange={e => prefill(e.target.value)}>
              <option value="" disabled>— choose a castaway —</option>
              {castaways.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div className="dossier-grid">
          <label className="flex flex-col gap-1 text-[11px]">NAME
            <input value={form.name} onChange={e => set('name', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">TRAIT
            <select value={form.trait} onChange={e => set('trait', e.target.value)}>
              {Object.keys(TRAITS).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px]">ARCHETYPE
            <select value={form.archetype} onChange={e => set('archetype', e.target.value)}>
              {ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px]">AGE
            <input type="number" value={form.age} onChange={e => set('age', Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">HOMETOWN
            <input value={form.hometown} onChange={e => set('hometown', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">JOB
            <input value={form.job} onChange={e => set('job', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">EDUCATION
            <input value={form.education} onChange={e => set('education', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">FAMILY
            <input value={form.family} onChange={e => set('family', e.target.value)} />
          </label>
        </div>

        <button className="btn red" onClick={generate} disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? '// generating...' : '▶ GENERATE TAPE'}
        </button>

        {error && <div className="c-red text-[11px]">{error}</div>}
        {tape && (
          <div className="dossier-section">
            <div className="c-dim text-[10px] mb-1">RESULT</div>
            <div className="dossier-backstory">{tape}</div>
          </div>
        )}
      </div>
    </div>
  )
}
