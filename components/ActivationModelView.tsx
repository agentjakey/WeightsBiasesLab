'use client'

import { useEffect, useRef, useState } from 'react'
import { BOUNDARY_COLOR, CLASS_COLORS } from '@/lib/neuron'
import { DOMAIN, Point, contourSegments } from '@/lib/activationModels'

const SIZE = 400 // SVG coordinate space (square)
const RES = 72 // probability-field resolution
const GRID = 52 // contour sampling resolution

type Forward = (x1: number, x2: number) => { z: number; yHat: number; prediction: 0 | 1 }

type Hover = { sx: number; sy: number; x1: number; x2: number; z: number; yHat: number }

function toSvg(x1: number, x2: number) {
  return {
    sx: ((x1 + DOMAIN) / (2 * DOMAIN)) * SIZE,
    sy: ((DOMAIN - x2) / (2 * DOMAIN)) * SIZE,
  }
}

function toData(sx: number, sy: number) {
  return {
    x1: (sx / SIZE) * 2 * DOMAIN - DOMAIN,
    x2: DOMAIN - (sy / SIZE) * 2 * DOMAIN,
  }
}

function rgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}
const C1 = rgb(CLASS_COLORS[1])
const C0 = rgb(CLASS_COLORS[0])

function paintField(canvas: HTMLCanvasElement, forward: Forward) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const off = document.createElement('canvas')
  off.width = RES
  off.height = RES
  const octx = off.getContext('2d')
  if (!octx) return

  const img = octx.createImageData(RES, RES)
  for (let j = 0; j < RES; j++) {
    for (let i = 0; i < RES; i++) {
      const x1 = ((i + 0.5) / RES) * 2 * DOMAIN - DOMAIN
      const x2 = DOMAIN - ((j + 0.5) / RES) * 2 * DOMAIN
      const { yHat } = forward(x1, x2)
      const strength = Math.abs(yHat - 0.5) * 2
      const alpha = Math.pow(strength, 1.25) * 0.32
      const c = yHat >= 0.5 ? C1 : C0
      const idx = (j * RES + i) * 4
      img.data[idx] = c.r
      img.data[idx + 1] = c.g
      img.data[idx + 2] = c.b
      img.data[idx + 3] = Math.round(alpha * 255)
    }
  }
  octx.putImageData(img, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height)
}

export function ActivationModelView({
  forward,
  points,
}: {
  forward: Forward
  points: Point[]
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const px = Math.max(1, Math.round(rect.width * dpr))
      canvas.width = px
      canvas.height = px
      paintField(canvas, forward)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (canvasRef.current) paintField(canvasRef.current, forward)
  }, [forward])

  // Decision boundary: the iso-0.5 contour of the actual forward pass.
  const values: number[][] = []
  for (let r = 0; r <= GRID; r++) {
    const row: number[] = []
    const x2 = DOMAIN - (r / GRID) * 2 * DOMAIN
    for (let c = 0; c <= GRID; c++) {
      const x1 = -DOMAIN + (c / GRID) * 2 * DOMAIN
      row.push(forward(x1, x2).yHat)
    }
    values.push(row)
  }
  const segs = contourSegments(values, 0.5)

  const gridLines = [-2, -1, 1, 2]

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const sx = ((e.clientX - rect.left) / rect.width) * SIZE
    const sy = ((e.clientY - rect.top) / rect.height) * SIZE
    const { x1, x2 } = toData(sx, sy)
    const { z, yHat } = forward(x1, x2)
    setHover({ sx, sy, x1, x2, z, yHat })
  }

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="relative aspect-square w-full overflow-hidden rounded border border-border bg-surface"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }} />

        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
          {gridLines.map((g) => {
            const v = toSvg(g, 0).sx
            const h = toSvg(0, g).sy
            return (
              <g key={`grid-${g}`}>
                <line x1={v} y1={0} x2={v} y2={SIZE} stroke="#1A1915" strokeOpacity={0.05} />
                <line x1={0} y1={h} x2={SIZE} y2={h} stroke="#1A1915" strokeOpacity={0.05} />
              </g>
            )
          })}
          <line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} stroke="#1A1915" strokeOpacity={0.16} />
          <line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke="#1A1915" strokeOpacity={0.16} />

          {/* decision boundary (iso 0.5 contour) */}
          {segs.map((s, i) => (
            <line
              key={`seg-${i}`}
              x1={(s.x1 / GRID) * SIZE}
              y1={(s.y1 / GRID) * SIZE}
              x2={(s.x2 / GRID) * SIZE}
              y2={(s.y2 / GRID) * SIZE}
              stroke={BOUNDARY_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}

          {/* sample points */}
          {points.map((p, i) => {
            const { sx, sy } = toSvg(p.x1, p.x2)
            const fill = CLASS_COLORS[p.y]
            const wrong = forward(p.x1, p.x2).prediction !== p.y
            return (
              <g key={`pt-${i}`}>
                {wrong && (
                  <circle
                    cx={sx}
                    cy={sy}
                    r={8}
                    fill="none"
                    stroke="#1A1915"
                    strokeOpacity={0.5}
                    strokeWidth={1.25}
                    strokeDasharray="2 3"
                  />
                )}
                <circle cx={sx} cy={sy} r={5} fill={fill} stroke="#FFFFFF" strokeWidth={1.25} />
              </g>
            )
          })}

          {hover && (
            <g>
              <line x1={hover.sx} y1={0} x2={hover.sx} y2={SIZE} stroke="#1A1915" strokeOpacity={0.2} strokeDasharray="3 3" />
              <line x1={0} y1={hover.sy} x2={SIZE} y2={hover.sy} stroke="#1A1915" strokeOpacity={0.2} strokeDasharray="3 3" />
              <circle cx={hover.sx} cy={hover.sy} r={4} fill="#1A1915" stroke="#FFFFFF" strokeWidth={1.5} />
            </g>
          )}
        </svg>

        <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] tracking-widest text-faint">
          x1
        </span>
        <span className="pointer-events-none absolute left-3 top-2 font-mono text-[10px] tracking-widest text-faint">
          x2
        </span>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded border border-border bg-surface px-3 py-2 font-mono text-[11px] leading-relaxed text-secondary shadow-sm"
            style={{
              left: `calc(${(hover.sx / SIZE) * 100}% + 14px)`,
              top: `calc(${(hover.sy / SIZE) * 100}% + 14px)`,
              transform: hover.sx > SIZE * 0.62 ? 'translateX(-100%) translateX(-28px)' : undefined,
            }}
          >
            <div>
              x1 <span className="text-primary">{hover.x1.toFixed(2)}</span>
              {'   '}x2 <span className="text-primary">{hover.x2.toFixed(2)}</span>
            </div>
            <div>
              z{' '}
              <span style={{ color: hover.z >= 0 ? CLASS_COLORS[1] : CLASS_COLORS[0] }}>{hover.z.toFixed(2)}</span>
              {'   '}yHat <span className="text-primary">{hover.yHat.toFixed(3)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
