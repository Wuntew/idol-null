'use client'

import { useMemo, useState } from 'react'
import CastawayCard from './CastawayCard'
import Portrait from './Portrait'

type Castaway = {
  id: number
  name: string
  archetype: string
  trait: string
  stats: Record<string, number>
  status: string
  condition: string
  idol_count: number
  seed: number
  tribe: number
  relationships?: Record<string, number>
  elimination_day?: number | null
  age?: number | null
  hometown?: string | null
  job?: string | null
  education?: string | null
  family?: string | null
  audition_tape?: string | null
  portrait_file?: string | null
}

type CastawayMemory = {
  grudges?: string[]
  fears?: string[]
  bonds?: string[]
  scars?: string[]
  obsessions?: string[]
  lastSeen?: string
}

const STAT_ABBR: Record<string, string> = {
  paranoia: 'PAR', gaslighting: 'GAS', likeability: 'LIK', physical: 'PHY', moxie: 'MOX',
}
const STAT_LABEL: Record<string, string> = {
  paranoia: 'Paranoia: higher means less stable and more likely to draw danger.',
  gaslighting: 'Gaslighting: higher means better at redirecting suspicion.',
  likeability: 'Likeability: higher means stronger social protection.',
  physical: 'Physical: higher means stronger challenge performance.',
  moxie: 'Moxie: higher means more clutch survival potential.',
}
const STAT_NAMES: Record<string, string> = {
  paranoia: 'Paranoia',
  gaslighting: 'Gaslighting',
  likeability: 'Likeability',
  physical: 'Physical',
  moxie: 'Moxie',
}

function stat(c: Castaway, key: string) {
  return Number(c.stats[key] ?? 0)
}

function getStatExtremes(c: Castaway) {
  const entries = Object.entries(c.stats).map(([key, value]) => ({ key, value: Number(value) }))
  const sorted = entries.sort((a, b) => b.value - a.value)
  return {
    strongest: sorted[0],
    weakest: sorted[sorted.length - 1],
  }
}

function getThreat(c: Castaway) {
  if (c.status === 'consumed') return { label: 'Consumed', className: 'c-red', score: 0 }
  if (c.status === 'ghost') return { label: 'Haunting', className: 'c-purple', score: 35 }
  const score = Math.round(
    stat(c, 'gaslighting') * 0.22 +
    stat(c, 'likeability') * 0.2 +
    stat(c, 'physical') * 0.18 +
    stat(c, 'moxie') * 0.22 +
    stat(c, 'paranoia') * 0.18 +
    c.idol_count * 8
  )
  if (score >= 76) return { label: 'Finalist Energy', className: 'c-yellow', score }
  if (score >= 62) return { label: 'Dangerous', className: 'c-amber', score }
  if (score >= 48) return { label: 'Unstable', className: 'c-purple', score }
  return { label: 'Low Signal', className: 'c-dim', score }
}

function getBootRisk(c: Castaway) {
  if (c.status !== 'alive') return { label: 'Ineligible', className: 'c-dim', score: 0 }
  const score = Math.round(
    stat(c, 'paranoia') * 0.38 +
    (100 - stat(c, 'likeability')) * 0.28 +
    (100 - stat(c, 'moxie')) * 0.18 +
    (c.condition === 'starving' ? 10 : 0) +
    (c.condition === 'hallucinating' ? 14 : 0) -
    c.idol_count * 10
  )
  if (score >= 70) return { label: 'High boot risk', className: 'c-red', score }
  if (score >= 48) return { label: 'Medium boot risk', className: 'c-amber', score }
  return { label: 'Low boot risk', className: 'c-green', score }
}

function getWinnerRead(c: Castaway) {
  if (c.status !== 'alive') return { label: 'Out of winner market', className: 'c-dim' }
  const score = stat(c, 'likeability') * 0.32 + stat(c, 'moxie') * 0.28 + stat(c, 'gaslighting') * 0.18 + stat(c, 'physical') * 0.12 - stat(c, 'paranoia') * 0.18 + c.idol_count * 8
  if (score >= 56) return { label: 'Winner upside', className: 'c-yellow' }
  if (score >= 38) return { label: 'Live but fragile', className: 'c-amber' }
  return { label: 'Long shot', className: 'c-dim' }
}

function getPlaystyle(c: Castaway) {
  const top = getStatExtremes(c).strongest?.key
  if (c.trait === 'Glitched') return 'Chaos catalyst'
  if (c.trait === 'Cannibalistic') return 'Predatory survivor'
  if (top === 'likeability') return 'Social shield'
  if (top === 'gaslighting') return 'Vote manipulator'
  if (top === 'physical') return 'Challenge weapon'
  if (top === 'paranoia') return 'Paranoia engine'
  if (top === 'moxie') return 'Clutch survivor'
  return 'Unclear signal'
}

function getPlayerRead(c: Castaway) {
  const boot = getBootRisk(c)
  const winner = getWinnerRead(c)
  const extremes = getStatExtremes(c)
  const strength = STAT_NAMES[extremes.strongest?.key ?? ''] ?? 'unknown'
  const liability = STAT_NAMES[extremes.weakest?.key ?? ''] ?? 'unknown'
  if (c.status === 'ghost') return `${c.name} is out of the vote but still contaminates the season through memory, hauntings, and unresolved bonds.`
  if (c.status === 'consumed') return `${c.name} has been consumed; only the absence remains useful as signal evidence.`
  return `${c.name} plays as a ${getPlaystyle(c).toLowerCase()}: strength ${strength}, liability ${liability}, ${boot.label.toLowerCase()}, ${winner.label.toLowerCase()}.`
}

function getBackstory(c: Castaway, memory: CastawayMemory | null) {
  const extremes = getStatExtremes(c)
  const strongest = extremes.strongest?.key ?? 'moxie'
  const weakest = extremes.weakest?.key ?? 'likeability'
  const workLife: Record<string, string> = {
    paranoia: 'a night-shift building inspector who kept notebooks full of exit routes, code violations, and conversations overheard through vents',
    gaslighting: 'a crisis publicist who could turn a scandal into a standing ovation before lunch',
    likeability: 'a small-town bartender who remembered every regular\'s drink, divorce, and bad knee',
    physical: 'a municipal pool lifeguard turned warehouse loader, used to long hours and heavier things than feelings',
    moxie: 'a debt collector for failing carnivals, paid mostly in cash, favors, and threats that never quite landed',
  }
  const homeLife: Record<string, string> = {
    paranoia: 'At home, family learned to announce themselves before entering a room.',
    gaslighting: 'Their family speaks in careful half-sentences, never fully sure which version of events will survive dinner.',
    likeability: 'They come from a loud, affectionate family that treats strangers like cousins and cousins like weather systems.',
    physical: 'Family life was practical: fix the fence, stack the wood, keep moving, do not make a ceremony out of pain.',
    moxie: 'They were raised by people who considered surrender a rude habit picked up by other families.',
  }
  const hobbyByTrait: Record<string, string> = {
    Cannibalistic: 'collect antique cookbooks, butcher knives, and recipes no one asks to read twice',
    Glitched: 'restore dead electronics and insist the machines whisper back in sequence',
    Paranoid: 'like locks, weather radios, and sitting with their back to a wall',
    Narcissistic: 'love karaoke, mirrors with good lighting, and any story that improves when they enter it',
    Feral: 'prefer trail running, stray dogs, and food eaten standing up',
    Hollow: 'keep houseplants, forget birthdays, and dislike being asked what they want',
  }
  const dislikeByWeakness: Record<string, string> = {
    paranoia: 'They dislike silence because silence always sounds organized.',
    gaslighting: 'They dislike being asked follow-up questions.',
    likeability: 'They dislike group hugs, team chants, and anyone who says "we are family" too early.',
    physical: 'They dislike stairs, heat, and people who mistake exhaustion for weakness.',
    moxie: 'They dislike ultimatums because they usually answer them badly.',
  }
  const traitReason: Record<string, string> = {
    Cannibalistic: 'On the island, hunger gives their manners teeth.',
    Glitched: 'On camera, their timing is always a half-second wrong.',
    Paranoid: 'The island rewards their suspicion just often enough to make it worse.',
    Narcissistic: 'They treat confessionals like mirrors that learned to applaud.',
    Feral: 'Comfort makes them suspicious; discomfort makes them useful.',
    Hollow: 'They seem calm until you notice how little of them is actually there.',
  }
  const fixationByTrait: Record<string, string> = {
    Cannibalistic: 'Lately, they keep talking about appetite like it is a moral philosophy.',
    Glitched: 'Lately, they have been losing time and blaming it on broken clocks.',
    Paranoid: 'Lately, they have been counting exits before counting allies.',
    Narcissistic: 'Lately, they have been rehearsing speeches for rooms that are not listening.',
    Feral: 'Lately, they have been sleeping closer to the tree line than the fire.',
    Hollow: 'Lately, they have been answering personal questions with weather reports.',
  }
  const usableMemory = [
    ...(memory?.scars ?? []),
    ...(memory?.fears ?? []),
    ...(memory?.grudges ?? []),
    ...(memory?.bonds ?? []),
  ].find(item =>
    !/\bsignal\b/i.test(item) &&
    !new RegExp(c.trait, 'i').test(item) &&
    !/^keeps watching tribe/i.test(item) &&
    !/^entered tribe/i.test(item)
  )
  const statusHook = c.status === 'ghost'
    ? 'Death has not made them less present.'
    : c.status === 'consumed'
      ? 'The island has already taken the part of them that explained the rest.'
      : c.condition === 'starving'
        ? 'Hunger is sanding off the social parts first.'
        : c.condition === 'hallucinating'
          ? 'Lately, the past keeps arriving before they do.'
          : 'For now, they still know which face to wear.'

  const fixation = usableMemory
    ? `Lately, they keep circling back to ${usableMemory}.`
    : fixationByTrait[c.trait] ?? statusHook

  return `${c.name} was ${workLife[strongest] ?? workLife.moxie}. ${homeLife[strongest] ?? homeLife.moxie} Away from work, they ${hobbyByTrait[c.trait] ?? 'keep habits that make more sense in private than under daylight'}. ${dislikeByWeakness[weakest] ?? dislikeByWeakness.likeability} ${traitReason[c.trait] ?? 'The island has not finished decoding them.'} ${fixation}`
}

function cleanMemoryItems(items: string[] | undefined, c: Castaway) {
  return (items ?? []).filter(item =>
    !/\bsignal\b/i.test(item) &&
    !new RegExp(c.trait, 'i').test(item) &&
    !/^keeps watching tribe/i.test(item) &&
    !/^entered tribe/i.test(item)
  )
}

function getInfluenceHooks(c: Castaway) {
  if (c.status !== 'alive') return ['Ghost Boost if their absence should keep damaging the living game.']
  const hooks = []
  if (c.idol_count === 0 && getBootRisk(c).score >= 48) hooks.push('Gift Idol protects a vulnerable pick before council.')
  if (stat(c, 'likeability') > 62) hooks.push('Broadcast Rumor can puncture their social shield.')
  if (stat(c, 'gaslighting') > 58) hooks.push('Leak Confessional exposes their control before it hardens.')
  if (stat(c, 'paranoia') > 62) hooks.push('Poison Bond turns their suspicion into vote pressure.')
  if (hooks.length === 0) hooks.push('Inject Anomaly is the cleanest way to destabilize this profile.')
  return hooks.slice(0, 3)
}

export default function CastawayRoster({
  castaways,
  nameLookup,
  seasonLabel,
  memories = {},
  defaultSelectedId,
}: {
  castaways: Castaway[]
  nameLookup: Record<string, string>
  seasonLabel: string
  memories?: Record<string, CastawayMemory>
  defaultSelectedId?: number
}) {
  const initial = castaways.find(c => c.status === 'alive') ?? castaways[0] ?? null
  const defaultId = defaultSelectedId ?? initial?.id ?? null
  const [selectedId, setSelectedId] = useState<number | null>(defaultId)

  const selected = useMemo(() => castaways.find(c => c.id === selectedId) ?? initial, [castaways, selectedId, initial])

  const selectedBonds = useMemo(() => {
    if (!selected) return []
    return Object.entries(selected.relationships ?? {})
      .filter(([id]) => Number(id) !== selected.id)
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
  }, [selected])
  const selectedMemory = selected ? memories[String(selected.id)] : null
  const profile = selected ? {
    threat: getThreat(selected),
    bootRisk: getBootRisk(selected),
    winnerRead: getWinnerRead(selected),
    extremes: getStatExtremes(selected),
    influenceHooks: getInfluenceHooks(selected),
  } : null
  const ally = selectedBonds.find(rel => rel.score > 0)
  const enemy = [...selectedBonds].reverse().find(rel => rel.score < 0)

  return (
    <div className="panel p-cyan" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="hdr cyan flex justify-between">
        <span>▣ CASTAWAY ROSTER</span>
        <span className="c-white">{castaways.filter(c => c.status === 'alive').length} alive</span>
      </div>

      <div className="p-2" style={{ borderBottom: '1px solid #052005' }}>
        {selected ? (
          <div className="panel p-yellow dossier-card">
            <div className="dossier-hero">
              <Portrait seed={selected.seed} trait={selected.trait} status={selected.status} condition={selected.condition} portraitFile={selected.portrait_file} />
              <div className="min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="c-white dossier-name nowrap" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.name}</div>
                    <div className="c-dim text-[10px]">{seasonLabel}</div>
                    {(selected.age || selected.hometown) && (
                      <div className="c-dim text-[10px]">
                        {selected.age ? `age ${selected.age}` : ''}{selected.age && selected.hometown ? ' · ' : ''}{selected.hometown ?? ''}
                      </div>
                    )}
                  </div>
                  {profile && <span className={`tag ${profile.threat.className}`}>{profile.threat.label}</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                  <span className="tag c-cyan">{selected.archetype}</span>
                  <span className="tag" style={{ color: '#00FFFF' }}>◈{selected.trait}</span>
                  <span className="tag c-dim">{selected.condition}</span>
                  {selected.idol_count > 0 && <span className="tag c-yellow">✦x{selected.idol_count}</span>}
                  <span className="tag c-dim">T{selected.tribe + 1}</span>
                </div>
                <div className="c-white text-[11px] mt-2 dossier-read">{getPlayerRead(selected)}</div>
              </div>
            </div>

            <div className="dossier-grid mt-3">
              <div className="dossier-section dossier-section-wide">
                <div className="c-amber text-[10px] tracking-wider mb-1">ORIGIN FILE</div>
                <div className="c-dim text-[10px] dossier-backstory">{getBackstory(selected, selectedMemory)}</div>
              </div>

              {(selected.job || selected.education || selected.family) && (
                <div className="dossier-section dossier-section-wide">
                  <div className="c-cyan text-[10px] tracking-wider mb-1">PERSONAL FILE</div>
                  <div className="grid gap-1">
                    {selected.job && <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Occupation</span><span className="c-white">{selected.job}</span></div>}
                    {selected.education && <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Education</span><span className="c-white">{selected.education}</span></div>}
                    {selected.family && <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Family</span><span className="c-white">{selected.family}</span></div>}
                  </div>
                </div>
              )}

              {selected.audition_tape && (
                <div className="dossier-section dossier-section-wide">
                  <div className="c-amber text-[10px] tracking-wider mb-1">AUDITION TAPE TRANSCRIPT</div>
                  <div className="c-amber text-[11px]" style={{ fontStyle: 'italic', lineHeight: 1.4 }}>{selected.audition_tape}</div>
                </div>
              )}

              <div className="dossier-section">
                <div className="c-cyan text-[10px] tracking-wider mb-1">SIGNAL READ</div>
                <div className="grid gap-1">
                  <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Playstyle</span><span className="c-white">{getPlaystyle(selected)}</span></div>
                  {profile && <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Threat</span><span className={profile.threat.className}>{profile.threat.score}/100</span></div>}
                  {profile && <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Strength</span><span className="c-green">{STAT_NAMES[profile.extremes.strongest?.key ?? ''] ?? 'unknown'}</span></div>}
                  {profile && <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Liability</span><span className="c-red">{STAT_NAMES[profile.extremes.weakest?.key ?? ''] ?? 'unknown'}</span></div>}
                </div>
              </div>

              <div className="dossier-section">
                <div className="c-amber text-[10px] tracking-wider mb-1">MARKET RELEVANCE</div>
                <div className="grid gap-1">
                  {profile && <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Daily boot</span><span className={profile.bootRisk.className}>{profile.bootRisk.label}</span></div>}
                  {profile && <div className="flex justify-between gap-2 text-[10px]"><span className="c-dim">Winner read</span><span className={profile.winnerRead.className}>{profile.winnerRead.label}</span></div>}
                  <div className="c-dim text-[10px]">High PAR and low LIK raise boot danger. LIK, MOX, and idols raise endgame upside.</div>
                </div>
              </div>

              <div className="dossier-section">
                <div className="c-yellow text-[10px] tracking-wider mb-1">STAT ANATOMY</div>
                <div className="grid gap-1">
                  {Object.entries(selected.stats).map(([k, v]) => (
                    <div key={`${selected.id}-${k}`} className="grid items-center gap-1" style={{ gridTemplateColumns: '30px 1fr 28px' }}>
                      <span className="c-dim" style={{ fontSize: 10 }} title={STAT_LABEL[k] ?? k}>{STAT_ABBR[k] ?? k.slice(0, 3).toUpperCase()}</span>
                      <div className="bar">
                        <i style={{ width: `${Math.round(Number(v))}%`, background: '#a07030' }} />
                      </div>
                      <span className="c-dim text-[10px] text-right">{Math.round(Number(v))}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dossier-section">
                <div className="c-green text-[10px] tracking-wider mb-1">RELATIONSHIP WEB</div>
                <div className="grid gap-1 text-[10px]">
                  <div className="flex justify-between gap-2"><span className="c-dim">Closest bond</span><span className="c-green">{ally ? `${nameLookup[ally.id] ?? ally.id} +${Math.round(ally.score)}` : 'none'}</span></div>
                  <div className="flex justify-between gap-2"><span className="c-dim">Open wound</span><span className="c-red">{enemy ? `${nameLookup[enemy.id] ?? enemy.id} ${Math.round(enemy.score)}` : 'none'}</span></div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedBonds.map(rel => (
                      <span key={rel.id} className={`tag ${rel.score > 2 ? 'c-green' : rel.score < -2 ? 'c-red' : 'c-dim'}`}>
                        {nameLookup[rel.id] ?? rel.id} {rel.score > 0 ? '+' : ''}{Math.round(rel.score)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dossier-section">
                <div className="c-purple text-[10px] tracking-wider mb-1">MEMORY TRACE</div>
                {selectedMemory ? (
                  <>
                    {selectedMemory.lastSeen && (
                      <div className="c-dim text-[10px]">{selectedMemory.lastSeen}</div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cleanMemoryItems(selectedMemory.grudges, selected).slice(0, 2).map(item => <span key={`g-${item}`} className="tag c-red">{item}</span>)}
                      {cleanMemoryItems(selectedMemory.fears, selected).slice(0, 2).map(item => <span key={`f-${item}`} className="tag c-amber">{item}</span>)}
                      {cleanMemoryItems(selectedMemory.bonds, selected).slice(0, 2).map(item => <span key={`b-${item}`} className="tag c-green">{item}</span>)}
                      {cleanMemoryItems(selectedMemory.scars, selected).slice(0, 2).map(item => <span key={`s-${item}`} className="tag c-purple">{item}</span>)}
                    </div>
                  </>
                ) : (
                  <div className="c-dim text-[10px]">No stored memory yet. The island has not learned their shape.</div>
                )}
              </div>

              <div className="dossier-section">
                <div className="c-red text-[10px] tracking-wider mb-1">INFLUENCE HOOKS</div>
                <div className="grid gap-1">
                  {profile?.influenceHooks.map(hook => (
                    <div key={hook} className="c-dim text-[10px]">- {hook}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="c-dim text-[11px]">Select a castaway to inspect their dossier.</div>
        )}
      </div>

      <div className="scroll p-1" style={{ maxHeight: 124 }}>
        {castaways.map(c => (
          <CastawayCard
            key={c.id}
            castaway={c}
            selected={c.id === selected?.id}
               onSelect={() => setSelectedId(c.id)}
          />
        ))}
      </div>
    </div>
  )
}
