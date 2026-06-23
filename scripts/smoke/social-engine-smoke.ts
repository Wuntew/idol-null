import assert from 'node:assert/strict'
import { applyInfluenceAction, simulateDay } from '../../lib/simulation/engine'
import type { Castaway } from '../../lib/simulation/types'

function castaway(id: number, name: string, status: Castaway['status'] = 'alive'): Castaway {
  const relationships = Object.fromEntries([1, 2, 3, 4, 5].filter(other => other !== id).map(other => [String(other), ((id * 17 + other * 11) % 81) - 40]))
  return {
    id, name, archetype: 'Operator', trait: id % 2 ? 'Paranoid' : 'Narcissistic',
    stats: { paranoia: 35 + id * 3, gaslighting: 45 + id * 4, likeability: 70 - id * 3, physical: 42 + id * 5, moxie: 40 + id * 6 },
    status, condition: 'healthy', idolCount: 0, seed: id * 991, relationships,
    romanticBonds: {}, tribe: 0, hunger: 80, injury: 0, loopCount: 0, challengeWins: id % 2,
  }
}

const initial = [castaway(1, 'Ada'), castaway(2, 'Bex'), castaway(3, 'Cato'), castaway(4, 'Dara'), castaway(5, 'Eli', 'ghost')]
const run = () => simulateDay({ castaways: structuredClone(initial), day: 9, merged: true, seed: 424242 })
const first = run()
const second = run()

assert.deepEqual(first, second, 'same state and seed must replay identically')
assert.ok(first.voteDecisions.length > 0, 'council must produce vote decisions')
assert.ok(first.voteDecisions.every(vote => vote.voterId !== vote.targetId), 'no voter may vote for themselves')
assert.ok(first.voteDecisions.every(vote => vote.confidence >= 5 && vote.confidence <= 95), 'vote confidence must remain bounded')
assert.ok(first.castawayUpdates.filter(row => row.status === 'alive').every(row => row.socialState?.intent), 'living castaways must retain an intent')
assert.ok(first.castawayUpdates.some(row => Object.values(row.socialState?.relationships ?? {}).some(value => typeof value.trust === 'number' && typeof value.suspicion === 'number')), 'relationships must persist dimensions')
assert.ok(first.juryDecisions.every(vote => first.castawayUpdates.some(row => row.id === vote.jurorId) && first.castawayUpdates.some(row => row.id === vote.finalistId)), 'jury ballots must reference season castaways')

const influenceCast = structuredClone(initial.filter(row => row.status === 'alive'))
const before = JSON.stringify(influenceCast.map(row => row.stats))
applyInfluenceAction('inject_anomaly', undefined, undefined, influenceCast)
assert.notEqual(JSON.stringify(influenceCast.map(row => row.stats)), before, 'targetless anomaly must mutate one living castaway')

console.log(`social-engine-smoke: ok (${first.voteDecisions.length} votes, ${first.events.length} structured events)`)
