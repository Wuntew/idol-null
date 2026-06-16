import { mulberry32 } from './engine'

export const TRAITS_ACCENT: Record<string, string> = {
  Cannibalistic: '#a05050',
  Glitched: '#8a6bbf',
  Paranoid: '#5a9a9a',
  Narcissistic: '#a89a5a',
  Feral: '#a07a4a',
  Hollow: '#5a8a5a',
}

const LEET: Record<string, string> = { A: '4', E: '3', I: '1', O: '0', S: '5' }

/** Deterministic per-castaway "misregistered" name, used as a low-opacity
 *  duplicate line when paranoia/gaslighting crosses the wrongness threshold. */
export function glitchName(name: string, seed: number): string {
  const rnd = mulberry32((seed ^ 0x5bd1e995) >>> 0)
  const chars = name.split('')
  const swappable = chars
    .map((ch, i) => ({ up: ch.toUpperCase(), i }))
    .filter(({ up }) => LEET[up])
  if (swappable.length === 0) return name
  const count = Math.min(swappable.length, 1 + Math.floor(rnd() * 2))
  const picks = new Set<number>()
  while (picks.size < count) {
    picks.add(swappable[Math.floor(rnd() * swappable.length)].i)
  }
  picks.forEach(i => { chars[i] = LEET[chars[i].toUpperCase()] })
  return chars.join('')
}
