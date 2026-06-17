'use client'
import { useEffect, useRef } from 'react'
import { mulberry32 } from '@/lib/simulation/engine'
import { TRAITS_ACCENT } from '@/lib/simulation/visuals'

function desat(hex: string): string {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  const a = ((r+g+b)/3)|0; const m = (v: number) => ('0'+Math.round((v+a)/2).toString(16)).slice(-2)
  return '#'+m(r)+m(g)+m(b)
}

function setPx(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) {
  ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1)
}

export default function Portrait({ seed, trait, status, condition, portraitFile }: {
  seed: number; trait: string; status: string; condition: string; portraitFile?: string | null
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const accent = TRAITS_ACCENT[trait] ?? '#00FF00'

  useEffect(() => {
    // Skip procedural draw if we have a real portrait
    if (portraitFile) return
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const rnd = mulberry32((seed ^ 0x9e3779b9) >>> 0)
    const N = 16; ctx.clearRect(0,0,N,N)

    if (status === 'consumed') {
      ctx.fillStyle = '#10001a'; ctx.fillRect(0,0,N,N)
      for (let i=0;i<46;i++) setPx(ctx,Math.floor(rnd()*16),Math.floor(rnd()*16),i%2?'#BD00FF':'#330044')
      return
    }

    const skins=['#e0ac69','#c68642','#8d5524','#f1c27d','#ffdbac','#a9745b','#7d9b6a','#b58a6a']
    let skin=skins[Math.floor(rnd()*skins.length)]
    let hair=['#221','#3a2a1a','#5a3a1a','#777','#101010','#4a2a4a','#6a1a1a'][Math.floor(rnd()*7)]
    let eye = trait==='Paranoid'?'#00FFFF':'#0c0c0c'
    if (condition==='starving') skin=desat(skin)
    if (condition==='hallucinating') eye='#BD00FF'
    if (status==='ghost') { skin='#0c3a0c'; hair='#0a280a'; eye='#00FF00' }

    for (let y=0;y<N;y++) {
      for (let x=0;x<8;x++) {
        let col:string|null=null
        const corner=(y<=3&&x<=3)||(y>=14&&x<=3)
        const inHead=(x>=3&&y>=3&&y<=13)&&!corner
        if (inHead) col=skin
        if (y>=2&&y<=4&&x>=4&&!corner) col=hair
        if (x===3&&y>=4&&y<=11&&rnd()<.72) col=hair
        if (y===6&&(x===5||x===6)&&rnd()<.5) col=hair
        if (y===7&&(x===5||x===6)) col=eye
        if (trait==='Paranoid'&&y===7&&(x===4||x===5||x===6)) col=eye
        if (y===11&&x>=5&&x<=7) col=(trait==='Cannibalistic')?'#FF0000':'#5a2a2a'
        if (trait==='Cannibalistic'&&y===12&&x===6&&rnd()<.8) col='#FF0000'
        if (trait==='Glitched'&&rnd()<.10) col=['#BD00FF','#00FFFF','#00FF00','#FF0000'][Math.floor(rnd()*4)]
        if (inHead&&!col&&rnd()<.04) col=accent
        if (col) { setPx(ctx,x,y,col); setPx(ctx,15-x,y,col) }
      }
    }
    if (trait==='Glitched') { for (let i=0;i<6;i++) setPx(ctx,Math.floor(rnd()*16),Math.floor(rnd()*16),['#BD00FF','#00FFFF'][i%2]) }
    if (trait==='Feral') { setPx(ctx,5,5,'#fff'); setPx(ctx,10,5,'#fff') }
    if (status==='ghost') ctx.globalAlpha=.85
  }, [seed, trait, status, condition, portraitFile])

  if (portraitFile) {
    return (
      <img
        src={`/portraits/${portraitFile}`}
        alt={trait}
        width={46}
        height={46}
        style={{
          width: 46, height: 46,
          imageRendering: 'pixelated',
          background: '#c8bfa8',
          border: `1px solid ${accent}`,
          opacity: status === 'consumed' ? 0.4 : status === 'ghost' ? 0.7 : 1,
          filter: status === 'ghost' ? 'grayscale(60%) brightness(0.7)' : status === 'consumed' ? 'grayscale(100%)' : undefined,
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <canvas ref={ref} width={16} height={16}
      style={{ width: 46, height: 46, imageRendering: 'pixelated', background: '#000', border: `1px solid ${accent}` }}
    />
  )
}
