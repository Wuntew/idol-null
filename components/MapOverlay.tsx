'use client'
import { useEffect, useRef, useCallback } from 'react'
import type { Tribe, TribeResources } from './IslandMap'

type Castaway = { id: number; name: string; status: string; tribe_id?: number | null }
type ChallengeArena = { label: string; x: number; y: number; sort_order: number }

interface Props {
  castaways: Castaway[]
  tribes: Tribe[]
  tribeResources: TribeResources[]
  challenges: ChallengeArena[]
  seasonSeed: number
  currentDay: number
  onClose: () => void
}

const TW = 136, TH = 68, TS = 5

function mulberry32(s: number) {
  return function () {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function noise2d(w: number, h: number, rng: () => number) {
  const g = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) g[i] = rng()
  return (x: number, y: number) => {
    const xi = Math.floor(x) % w, yi = Math.floor(y) % h
    const xi1 = (xi + 1) % w, yi1 = (yi + 1) % h
    const fx = x - Math.floor(x), fy = y - Math.floor(y)
    const a = g[yi * w + xi], b = g[yi * w + xi1]
    const c = g[yi1 * w + xi], d = g[yi1 * w + xi1]
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
  }
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function blend(base: number, ov: number, a: number) {
  return Math.round(base * (1 - a) + ov * a)
}

const TILE_CLR = [
  ['#0a1628', '#0c1930'], ['#0e2a4a', '#102e50'], ['#1a4a6e', '#1d5278'],
  ['#1a3d0a', '#1e460c'], ['#0f2d05', '#123408'], ['#5c3d1a', '#63421c'],
  ['#3d2d1a', '#45321e'], ['#3a2500', '#3f2900'],
]
const EV_CLR: Record<number, string> = {
  1: '#cc3300', 2: '#2a1a0a', 3: '#1a5a8a', 4: '#8a6a2a',
  5: '#6a0a0a', 6: '#6a0a8a', 7: '#3a3a6a', 8: '#8a6a1a',
  9: '#0a000a', 10: '#2a4a6a', 11: '#8a8a9a', 12: '#cc4400',
}

export default function MapOverlay({ castaways, tribes, tribeResources, challenges, seasonSeed, currentDay, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Pan/zoom state (refs to avoid re-render)
  const zoom = useRef(1)
  const panX = useRef(0)
  const panY = useRef(0)
  const lastTouch = useRef<{ x: number; y: number } | null>(null)
  const lastPinchDist = useRef<number | null>(null)
  const rafPending = useRef(false)

  const applyTransform = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    el.style.transform = `translate(${panX.current}px, ${panY.current}px) scale(${zoom.current})`
  }, [])

  const clampPan = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const z = zoom.current
    const cw = canvas.offsetWidth * z
    const ch = canvas.offsetHeight * z
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxX = Math.max(0, (cw - vw) / 2)
    const maxY = Math.max(0, (ch - vh) / 2)
    panX.current = Math.max(-maxX, Math.min(maxX, panX.current))
    panY.current = Math.max(-maxY, Math.min(maxY, panY.current))
  }, [])

  // Touch handlers
  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastPinchDist.current = null
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
      lastTouch.current = null
    }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x
      const dy = e.touches[0].clientY - lastTouch.current.y
      panX.current += dx
      panY.current += dy
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      clampPan()
      if (!rafPending.current) {
        rafPending.current = true
        requestAnimationFrame(() => { applyTransform(); rafPending.current = false })
      }
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delta = dist / lastPinchDist.current
      zoom.current = Math.max(0.6, Math.min(4, zoom.current * delta))
      lastPinchDist.current = dist
      clampPan()
      if (!rafPending.current) {
        rafPending.current = true
        requestAnimationFrame(() => { applyTransform(); rafPending.current = false })
      }
    }
  }, [applyTransform, clampPan])

  const onTouchEnd = useCallback(() => {
    lastTouch.current = null
    lastPinchDist.current = null
  }, [])

  // Attach touch listeners with passive:false so we can preventDefault
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  // Canvas drawing — same logic as IslandMap
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxOrNull = canvas.getContext('2d')
    if (!ctxOrNull) return
    const ctx: CanvasRenderingContext2D = ctxOrNull

    const tribeMap = Object.fromEntries(tribes.map(t => [t.id, t]))
    const resourceMap = Object.fromEntries(tribeResources.map(r => [r.tribe_id, r]))

    const rng = mulberry32(seasonSeed)
    const n1 = noise2d(16, 9, rng), n2 = noise2d(32, 18, rng), n3 = noise2d(64, 36, rng)

    const terrain = new Uint8Array(TW * TH)
    const hmap = new Float32Array(TW * TH)
    const cxc = TW / 2, cyc = TH / 2

    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const nx = x / TW * 16, ny = y / TH * 9
      const v = n1(nx, ny) * 0.5 + n2(nx * 2, ny * 2) * 0.3 + n3(nx * 4, ny * 4) * 0.2
      const dx = (x - cxc) / (cxc * 0.78), dy = (y - cyc) / (cyc * 0.72)
      const r = Math.sqrt(dx * dx + dy * dy), fall = Math.max(0, 1 - r * r)
      const h = v * fall
      hmap[y * TW + x] = h
      terrain[y * TW + x] = h < 0.08 ? 0 : h < 0.14 ? 1 : h < 0.19 ? 2 : h < 0.32 ? 3 : h < 0.46 ? 4 : h < 0.58 ? 5 : 3
    }

    const ruinRng = mulberry32(seasonSeed ^ 0xDEAD)
    const rox = Math.floor(cxc + (ruinRng() - 0.5) * 20)
    const roy = Math.floor(cyc + (ruinRng() - 0.5) * 12)
    for (let dy = -3; dy <= 3; dy++) for (let dx = -4; dx <= 4; dx++) {
      const i = (roy + dy) * TW + (rox + dx)
      if (i >= 0 && i < TW * TH && terrain[i] >= 3) terrain[i] = 6
    }

    const campRng = mulberry32(seasonSeed ^ 0xCAFE)
    for (let c = 0; c < 2; c++) {
      const a = (c / 2) * Math.PI * 2 + campRng() * 0.8
      const r = 0.35 + campRng() * 0.15
      const campX = Math.floor(cxc + Math.cos(a) * cxc * r)
      const campY = Math.floor(cyc + Math.sin(a) * cyc * r)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const i = (campY + dy) * TW + (campX + dx)
        if (i >= 0 && i < TW * TH && terrain[i] >= 2) terrain[i] = 7
      }
    }

    const castawayPositions = castaways.map(c => {
      const pr = mulberry32(seasonSeed ^ (c.id * 0x9E3779B9))
      const tribe = c.tribe_id != null ? tribeMap[c.tribe_id] : null
      if (c.status === 'alive' && tribe) {
        for (let attempt = 0; attempt < 300; attempt++) {
          const angle = pr() * Math.PI * 2
          const radius = pr() * 12
          const x = Math.round(tribe.camp_x + Math.cos(angle) * radius)
          const y = Math.round(tribe.camp_y + Math.sin(angle) * radius)
          if (x >= 0 && x < TW && y >= 0 && y < TH && terrain[y * TW + x] >= 2)
            return { ...c, x, y, color: tribe.color }
        }
      }
      for (let attempt = 0; attempt < 200; attempt++) {
        const x = Math.floor(pr() * TW), y = Math.floor(pr() * TH)
        if (terrain[y * TW + x] >= 2) return { ...c, x, y, color: tribe?.color ?? '#00ff44' }
      }
      return { ...c, x: Math.floor(TW / 2), y: Math.floor(TH / 2), color: tribe?.color ?? '#00ff44' }
    })

    const challengeArenas: { label: string; x: number; y: number }[] = challenges.length > 0
      ? (() => {
          const groups: Record<string, typeof challenges> = {}
          for (const c of challenges) { if (!groups[c.label]) groups[c.label] = []; groups[c.label].push(c) }
          return Object.entries(groups).map(([label, pool]) => {
            const sorted = pool.slice().sort((a, b) => a.sort_order - b.sort_order)
            const pick = sorted[currentDay % sorted.length]
            return { label, x: pick.x, y: pick.y }
          })
        })()
      : [{ label: 'Immunity', x: Math.floor(TW * 0.6), y: Math.floor(TH * 0.35) }]

    const ev = new Uint8Array(TW * TH)
    const age = new Uint8Array(TW * TH)
    const evRng = mulberry32(seasonSeed ^ 0xE4E4)
    const evTypes = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    for (let i = 0; i < 22; i++) {
      const x = Math.floor(evRng() * TW), y = Math.floor(evRng() * TH)
      const idx = y * TW + x
      if (terrain[idx] >= 2) { ev[idx] = evTypes[Math.floor(evRng() * evTypes.length)]; age[idx] = 0 }
    }

    const DIRS = [-1, 1, -TW, TW]
    function spreadEvents() {
      const add: number[] = []
      for (let i = 0; i < TW * TH; i++) {
        if (!ev[i]) continue
        age[i]++
        const t = ev[i]
        if (t === 1 && Math.random() < 0.06) { const ni = i + DIRS[Math.floor(Math.random() * 4)]; if (ni >= 0 && ni < TW * TH && terrain[ni] >= 2 && !ev[ni]) add.push(ni, 1) }
        if (t === 1 && age[i] > 18) add.push(i, 2)
        if (t === 3 && Math.random() < 0.04) { const ni = i + DIRS[Math.floor(Math.random() * 4)]; if (ni >= 0 && ni < TW * TH && terrain[ni] >= 1 && !ev[ni]) add.push(ni, 3) }
        if (t === 7 && age[i] > 5) add.push(i, terrain[i] >= 3 ? 1 : 0)
        if (t === 10) { for (const d of DIRS) { const ni = i + d; if (ni >= 0 && ni < TW * TH && (ev[ni] === 1 || ev[ni] === 7)) add.push(ni, 10) } }
        if (t === 11 && age[i] > 35) add.push(i, 0)
        if (t === 12) { if (Math.random() < 0.05) { const ni = i + DIRS[Math.floor(Math.random() * 4)]; if (ni >= 0 && ni < TW * TH && hmap[ni] <= hmap[i] + 0.08 && terrain[ni] >= 1 && !ev[ni]) add.push(ni, 12) } if (age[i] > 22) add.push(i, 2) }
        if ([2, 4, 5, 6, 8, 9].includes(t) && age[i] > 80) add.push(i, 0)
      }
      for (let j = 0; j < add.length; j += 2) { ev[add[j]] = add[j + 1]; if (!add[j + 1]) age[add[j]] = 0 }
    }

    const img = ctx.createImageData(TW * TS, TH * TS)
    const d = img.data
    let tick = 0, lastFrame = 0, rafId: number

    function setPixel(px: number, py: number, r: number, g: number, b: number) {
      const i = (py * (TW * TS) + px) * 4
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255
    }

    function render(ts: number) {
      if (ts - lastFrame > 80) {
        lastFrame = ts; tick++; spreadEvents()
        for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
          const idx = ty * TW + tx, t = terrain[idx], e = ev[idx]
          const check = (tx + ty) % 2
          let [r, g, b] = hexToRgb(TILE_CLR[t][check])
          if (e) { const [er, eg, eb] = hexToRgb(EV_CLR[e] ?? '#333'); const a = e === 9 ? 0.9 : 0.65; r = blend(r, er, a); g = blend(g, eg, a); b = blend(b, eb, a) }
          if (t <= 1) { const wt = (tick * 0.15 + (tx + ty) * 0.1) % (Math.PI * 2); const wb = Math.sin(wt) * 8 | 0; r = Math.max(0, Math.min(255, r + wb)) }
          for (let py = 0; py < TS; py++) for (let px = 0; px < TS; px++) setPixel(tx * TS + px, ty * TS + py, r, g, b)
        }
        ctx.putImageData(img, 0, 0)
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

        // Tribe camps
        for (const tribe of tribes) {
          if (tribe.is_merge_tribe) continue
          const sx = tribe.camp_x * TS + TS / 2, sy = tribe.camp_y * TS + TS / 2
          const res = resourceMap[tribe.id]
          ctx.fillStyle = tribe.color; ctx.globalAlpha = 0.85
          ctx.fillRect(sx - 8, sy - 8, 16, 16)
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.strokeRect(sx - 8, sy - 8, 16, 16)
          ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'
          ctx.fillText(tribe.name[0], sx, sy)
          ctx.font = 'bold 8px monospace'; ctx.fillStyle = tribe.color; ctx.globalAlpha = 0.95
          ctx.fillText(tribe.name, sx, sy - 14); ctx.globalAlpha = 1
          if (res) {
            const icons: [string, string][] = [
              ['F', res.food > 60 ? '#44cc44' : res.food > 30 ? '#ccaa00' : '#cc3300'],
              ['W', res.hydration > 60 ? '#44aaff' : res.hydration > 30 ? '#ccaa00' : '#cc3300'],
              ['S', res.shelter_level >= 3 ? '#44cc44' : '#ccaa00'],
              ['~', res.fire_level >= 3 ? '#ff8800' : '#cc6600'],
            ]
            icons.forEach(([label, color], i) => {
              ctx.fillStyle = color; ctx.font = '7px monospace'; ctx.globalAlpha = 0.9
              ctx.fillText(label, sx - 12 + i * 8, sy + 14)
            })
            ctx.globalAlpha = 1
          }
        }

        // Castaways
        for (const c of castawayPositions) {
          const sx = c.x * TS + TS / 2, sy = c.y * TS + TS / 2
          const alive = c.status === 'alive'
          const dotColor = alive ? ((c as any).color ?? '#00ff44') : '#ff4444'
          ctx.globalAlpha = alive ? 1 : 0.45
          ctx.fillStyle = dotColor; ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#000'; ctx.lineWidth = 0.8; ctx.stroke()
          ctx.fillStyle = '#000'; ctx.globalAlpha = 1; ctx.font = 'bold 8px monospace'
          ctx.fillText(c.name[0], sx, sy)
          ctx.font = '7px monospace'; ctx.fillStyle = dotColor; ctx.globalAlpha = alive ? 0.85 : 0.4
          ctx.fillText(c.name.slice(0, 5), sx, sy - 8); ctx.globalAlpha = 1
        }

        // Challenge arenas
        for (const ch of challengeArenas) {
          const sx = ch.x * TS + TS / 2, sy = ch.y * TS + TS / 2
          ctx.fillStyle = '#FFD700'; ctx.globalAlpha = 0.95
          ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke()
          ctx.fillStyle = '#000'; ctx.globalAlpha = 1; ctx.font = 'bold 8px monospace'
          ctx.fillText(ch.label === 'Immunity' ? 'IM' : 'RW', sx, sy)
          ctx.fillStyle = '#FFD700'; ctx.globalAlpha = 0.9
          ctx.fillText(ch.label, sx, sy - 13); ctx.globalAlpha = 1
        }

        ctx.restore()
      }
      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [castaways, tribes, tribeResources, challenges, seasonSeed, currentDay])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Island map"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: '#000', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      {/* Pannable/zoomable canvas wrapper */}
      <div
        ref={containerRef}
        style={{
          transformOrigin: 'center center',
          willChange: 'transform',
          lineHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={TW * TS}
          height={TH * TS}
          role="img"
          aria-label="Zoomable island map with castaways, camps, resources, and challenges"
          style={{ display: 'block', width: '100vw', imageRendering: 'pixelated' }}
        />
      </div>

      {/* HUD: close + zoom buttons */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10,
      }}>
        <button aria-label="Close island map" onClick={onClose} style={btnStyle('#cc3300')}>✕</button>
        <button aria-label="Zoom in island map" onClick={() => { zoom.current = Math.min(4, zoom.current * 1.4); clampPan(); applyTransform() }} style={btnStyle('#1a3a1a')}>+</button>
        <button aria-label="Zoom out island map" onClick={() => { zoom.current = Math.max(0.6, zoom.current / 1.4); clampPan(); applyTransform() }} style={btnStyle('#1a3a1a')}>−</button>
      </div>

      {/* Tribe legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 8,
        background: 'rgba(4,10,4,0.88)', border: '1px solid #1a3a1a',
        padding: '6px 10px', fontFamily: 'monospace', fontSize: 11,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {tribes.filter(t => !t.is_merge_tribe).map(t => (
          <span key={t.id} style={{ color: t.color }}>■ {t.name}</span>
        ))}
        <span style={{ color: '#FFD700' }}>● Challenge</span>
        <span style={{ color: '#ff4444' }}>● Eliminated</span>
        <span style={{ color: '#888', fontSize: 11 }}>F=food W=water S=shelter ~=fire</span>
      </div>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg, border: '1px solid #2a4a2a', color: '#00cc44',
    width: 32, height: 32, fontFamily: 'monospace', fontSize: 16,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
