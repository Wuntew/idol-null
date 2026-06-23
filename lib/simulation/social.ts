import type { Castaway, JuryDecision, RelationshipDimensions, SocialState, VoteDecision } from './types'

const clamp = (value: number, min = -100, max = 100) => Math.max(min, Math.min(max, value))

export function normalizeRelationship(value: unknown): RelationshipDimensions {
  if (typeof value === 'number') {
    return { trust: value, fear: 0, attraction: 0, suspicion: -value / 2, obligation: Math.max(0, value / 2), respect: value / 2 }
  }
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    trust: clamp(Number(row.trust ?? 0)), fear: clamp(Number(row.fear ?? 0), 0, 100),
    attraction: clamp(Number(row.attraction ?? 0), 0, 100), suspicion: clamp(Number(row.suspicion ?? 0), 0, 100),
    obligation: clamp(Number(row.obligation ?? 0), 0, 100), respect: clamp(Number(row.respect ?? 0)),
  }
}

export function normalizeSocialState(castaway: Castaway, day: number): SocialState {
  const existing = castaway.socialState
  const relationships = Object.fromEntries(Object.entries(existing?.relationships ?? castaway.relationships ?? {}).map(([id, value]) => [id, normalizeRelationship(value)]))
  return {
    relationships,
    intent: existing?.intent ?? { type: 'survive', targetId: null, reason: `Reach Day ${day + 1}` },
    promises: existing?.promises ?? [], secrets: existing?.secrets ?? [],
  }
}

function affinity(voter: Castaway, target: Castaway) {
  const rel = normalizeRelationship(voter.socialState?.relationships[String(target.id)] ?? voter.relationships[String(target.id)] ?? 0)
  return rel.trust + rel.obligation * .5 + rel.respect * .25 - rel.suspicion - rel.fear * .35
}

function threat(target: Castaway) {
  return target.stats.physical * .2 + target.stats.moxie * .35 + target.stats.likeability * .25 + (target.challengeWins ?? 0) * 12 + target.idolCount * 10
}

export function assignDailyIntent(castaway: Castaway, others: Castaway[]): SocialState['intent'] {
  const enemy = [...others].sort((a, b) => affinity(castaway, a) - affinity(castaway, b))[0]
  const threatTarget = [...others].sort((a, b) => threat(b) - threat(a))[0]
  if (enemy && affinity(castaway, enemy) < -35) return { type: 'expose', targetId: enemy.id, reason: `Distrust of ${enemy.name}` }
  if (threatTarget && threat(threatTarget) > 65) return { type: 'remove_threat', targetId: threatTarget.id, reason: `${threatTarget.name} is becoming difficult to beat` }
  const ally = [...others].sort((a, b) => affinity(castaway, b) - affinity(castaway, a))[0]
  if (ally && affinity(castaway, ally) > 30) return { type: 'protect', targetId: ally.id, reason: `Preserve the bond with ${ally.name}` }
  return { type: 'survive', targetId: null, reason: 'Avoid becoming the consensus target' }
}

export function planVotes(voters: Castaway[], candidates: Castaway[], immuneId: number | null, random: () => number, day = 0): VoteDecision[] {
  const eligible = candidates.filter(candidate => candidate.id !== immuneId)
  const leaders = [...voters].sort((a, b) => b.stats.moxie + b.stats.gaslighting - a.stats.moxie - a.stats.gaslighting)
  const plans = leaders.slice(0, Math.min(2, leaders.length)).map((leader, index) => {
    const targets = eligible.filter(target => target.id !== leader.id).map(target => ({ target, score: threat(target) - affinity(leader, target) * .8 + random() * 8 }))
    targets.sort((a, b) => b.score - a.score)
    return { id: `bloc-${index + 1}`, leader, target: targets[0]?.target }
  }).filter(plan => plan.target)

  return voters.flatMap(voter => {
    const options = plans.filter(plan => plan.target?.id !== voter.id).map(plan => ({ plan, buyIn: affinity(voter, plan.leader) + voter.stats.moxie * .2 + random() * 12 }))
    options.sort((a, b) => b.buyIn - a.buyIn)
    const chosen = options[0]?.plan
    let target = chosen?.target
    let reason: VoteDecision['reason'] = 'coalition'
    if (!target || (options[0]?.buyIn ?? -Infinity) < -20) {
      target = [...eligible.filter(row => row.id !== voter.id)].sort((a, b) => (threat(b) - affinity(voter, b)) - (threat(a) - affinity(voter, a)))[0]
      reason = target && affinity(voter, target) < -25 ? 'enemy' : 'self_preservation'
    } else if (voter.socialState?.intent.targetId === target.id) reason = voter.socialState.intent.type === 'remove_threat' ? 'threat' : 'enemy'
    if (!target) return []
    const promise = voter.socialState?.promises.find(item => item.toId === target!.id && !item.broken)
    if (promise) { promise.broken = true; reason = 'betrayal' }
    if (chosen && chosen.leader.id !== voter.id && voter.socialState && !voter.socialState.promises.some(item => item.toId === chosen.leader.id && item.kind === 'vote_with' && !item.broken)) {
      voter.socialState.promises.push({ toId: chosen.leader.id, kind: 'vote_with', day })
    }
    return [{ voterId: voter.id, targetId: target.id, reason, confidence: Math.round(Math.max(5, Math.min(95, 55 + (options[0]?.buyIn ?? 0)))), coalitionId: chosen?.id ?? null, coalitionLeaderId: chosen?.leader.id ?? null }]
  })
}

export function simulateJury(jurors: Castaway[], finalists: Castaway[], random: () => number): JuryDecision[] {
  return jurors.map(juror => {
    const ranked = finalists.map(finalist => ({ finalist, score: affinity(juror, finalist) + finalist.stats.moxie * .35 + finalist.stats.likeability * .2 + (finalist.challengeWins ?? 0) * 8 + random() * 6 })).sort((a, b) => b.score - a.score)
    const winner = ranked[0].finalist
    return { jurorId: juror.id, finalistId: winner.id, reason: affinity(juror, winner) > 20 ? 'loyalty and respect' : 'strategic respect' }
  })
}
