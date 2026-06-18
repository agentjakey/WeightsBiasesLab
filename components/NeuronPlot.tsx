'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BOUNDARY_COLOR,
  CLASS_COLORS,
  DOMAIN,
  SAMPLES,
  Weights,
  boundaryEndpoints,
  isDegenerate,
  neuronForward,
} from '@/lib/neuron'

const SIZE = 400 // SVG coordinate space (square)
const RES = 120 // heatmap resolution per axis

type Hover = {
  sx: number
  sy: number
  x1: number
  x2: number
  z: number
  yHat: number
}

// data coords -> svg coords
function toSvg(x1: number, x2: number) {
  return {
    sx: ((x1 + DOMAIN) / (2 * DOMAIN)) * SIZE,
    sy: ((DOMAIN - x2) / (2 * DOMAIN)) * SIZE,
  }
}

// svg coords -> data coords
function toData(sx: number, sy: number) {
  return {
    x1: (sx / SIZE) * 2 * DOMAIN - DOMAIN,
    x2: DOMAIN - (sy / SIZE) * 2 * DOMAIN,
  }
}

// rgb channels for the two-class tints (parsed from CLASS_COLORS)
function rgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}
const C1 = rgb(CLASS_COLORS[1])
const C0 = rgb(CLASS_COLORS[0])

function paintField(canvas: HTMLCanvasElement, w: Weights) {
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
      const { yHat } = neuronForward(x1, x2, w)
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

export function NeuronPlot({ weights }: { weights: Weights }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  // keep the canvas backing store matched to its rendered size
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
      paintField(canvas, weights)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // repaint when weights change
  useEffect(() => {
    if (canvasRef.current) paintField(canvasRef.current, weights)
  }, [weights])

  const ends = boundaryEndpoints(weights)
  const degenerate = isDegenerate(weights)
  const gridLines = [-3, -2, -1, 1, 2, 3]

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const sx = ((e.clientX - rect.left) / rect.width) * SIZE
    const sy = ((e.clientY - rect.top) / rect.height) * SIZE
    const { x1, x2 } = toData(sx, sy)
    const { z, yHat } = neuronForward(x1, x2, weights)
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
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: 'none' }}
        />

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: 'none' }}
        >
          {/* grid */}
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

          {/* axes */}
          <line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} stroke="#1A1915" strokeOpacity={0.16} />
          <line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke="#1A1915" strokeOpacity={0.16} />

          {/* decision boundary (z = 0) */}
          {ends && !degenerate && (
            <line
              x1={toSvg(ends[0].x1, ends[0].x2).sx}
              y1={toSvg(ends[0].x1, ends[0].x2).sy}
              x2={toSvg(ends[1].x1, ends[1].x2).sx}
              y2={toSvg(ends[1].x1, ends[1].x2).sy}
              stroke={BOUNDARY_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
            />
          )}

          {/* sample points */}
          {SAMPLES.map((p, i) => {
            const { sx, sy } = toSvg(p.x1, p.x2)
            const fill = CLASS_COLORS[p.label]
            const wrong = neuronForward(p.x1, p.x2, weights).prediction !== p.label
            return (
              <g key={`pt-${i}`}>
                {wrong && (
                  <circle
                    cx={sx}
                    cy={sy}
                    r={10}
                    fill="none"
                    stroke="#1A1915"
                    strokeOpacity={0.5}
                    strokeWidth={1.25}
                    strokeDasharray="2 3"
                  />
                )}
                <circle cx={sx} cy={sy} r={6} fill={fill} stroke="#FFFFFF" strokeWidth={1.5} />
              </g>
            )
          })}

          {/* hover crosshair */}
          {hover && (
            <g>
              <line
                x1={hover.sx}
                y1={0}
                x2={hover.sx}
                y2={SIZE}
                stroke="#1A1915"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />
              <line
                x1={0}
                y1={hover.sy}
                x2={SIZE}
                y2={hover.sy}
                stroke="#1A1915"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />
              <circle cx={hover.sx} cy={hover.sy} r={4} fill="#1A1915" stroke="#FFFFFF" strokeWidth={1.5} />
            </g>
          )}
        </svg>

        {/* axis labels */}
        <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] tracking-widest text-faint">
          x1
        </span>
        <span className="pointer-events-none absolute left-3 top-2 font-mono text-[10px] tracking-widest text-faint">
          x2
        </span>

        {/* degenerate-boundary note */}
        {degenerate && (
          <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
            <p className="mx-auto max-w-[280px] rounded border border-border bg-muted px-4 py-3 font-sans text-[13px] leading-relaxed text-secondary">
              With w<sub>1</sub> and w<sub>2</sub> near zero, the neuron has no meaningful boundary:
              z is just the bias everywhere.
            </p>
          </div>
        )}

        {/* hover readout */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded border border-border bg-surface px-3 py-2 font-mono text-[11px] leading-relaxed text-secondary shadow-sm"
            style={{
              left: `calc(${(hover.sx / SIZE) * 100}% + 14px)`,
              top: `calc(${(hover.sy / SIZE) * 100}% + 14px)`,
              transform:
                hover.sx > SIZE * 0.62 ? 'translateX(-100%) translateX(-28px)' : undefined,
            }}
          >
            <div>
              x1 <span className="text-primary">{hover.x1.toFixed(2)}</span>
              {'   '}x2 <span className="text-primary">{hover.x2.toFixed(2)}</span>
            </div>
            <div>
              z{' '}
              <span style={{ color: hover.z >= 0 ? CLASS_COLORS[1] : CLASS_COLORS[0] }}>
                {hover.z.toFixed(2)}
              </span>
              {'   '}yHat <span className="text-primary">{hover.yHat.toFixed(3)}</span>
            </div>
          </div>
        )}
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-secondary">
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: CLASS_COLORS[1] }}
          />{' '}
          class 1
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: CLASS_COLORS[0] }}
          />{' '}
          class 0
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-[2px] w-5 rounded" style={{ background: BOUNDARY_COLOR }} />{' '}
          boundary (z = 0)
        </span>
        <span className="flex items-center gap-2 text-faint">
          <span className="inline-block h-3 w-3 rounded-full border border-dashed border-[#1A1915]/50" />{' '}
          misclassified
        </span>
      </div>
    </div>
  )
}
