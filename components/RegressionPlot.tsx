'use client'

import { useState } from 'react'
import { CLASS_COLORS } from '@/lib/neuron'
import {
  MLPRegressor,
  RegressionPoint,
  X_MAX,
  X_MIN,
  Y_MAX,
  Y_MIN,
  predict,
  targetFn,
} from '@/lib/capacityModels'

const W = 460
const H = 360
const PAD = 8

function sx(x: number) {
  return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD)
}
function sy(y: number) {
  return PAD + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * (H - 2 * PAD)
}

function curvePath(fn: (x: number) => number, samples = 220): string {
  let d = ''
  for (let i = 0; i <= samples; i++) {
    const x = X_MIN + (i / samples) * (X_MAX - X_MIN)
    const px = sx(x)
    const py = sy(fn(x))
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)} ${py.toFixed(2)} `
  }
  return d.trim()
}

type Hover = { sxp: number; x: number; yPred: number; yTrue: number }

export function RegressionPlot({
  model,
  train,
}: {
  model: MLPRegressor
  train: RegressionPoint[]
}) {
  const [hover, setHover] = useState<Hover | null>(null)

  const truePath = curvePath(targetFn)
  const predPath = curvePath((x) => predict(model, x))
  const gridX = [-2, -1, 0, 1, 2]
  const gridY = [-1, 0, 1]

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const x = X_MIN + ((px - PAD) / (W - 2 * PAD)) * (X_MAX - X_MIN)
    if (x < X_MIN || x > X_MAX) {
      setHover(null)
      return
    }
    setHover({ sxp: px, x, yPred: predict(model, x), yTrue: targetFn(x) })
  }

  return (
    <div className="relative">
      <div className="relative aspect-[460/360] w-full overflow-hidden rounded border border-border bg-surface">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
        >
          {gridX.map((g) => (
            <line key={`gx-${g}`} x1={sx(g)} y1={0} x2={sx(g)} y2={H} stroke="#1A1915" strokeOpacity={g === 0 ? 0.16 : 0.05} />
          ))}
          {gridY.map((g) => (
            <line key={`gy-${g}`} x1={0} y1={sy(g)} x2={W} y2={sy(g)} stroke="#1A1915" strokeOpacity={g === 0 ? 0.16 : 0.05} />
          ))}

          {/* true target (subtle, dashed) */}
          <path d={truePath} fill="none" stroke="#8A8880" strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.8} />

          {/* model prediction (clear, accent) */}
          <path d={predPath} fill="none" stroke="#C2411C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* training points */}
          {train.map((p, i) => (
            <circle key={`tp-${i}`} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={CLASS_COLORS[0]} stroke="#FFFFFF" strokeWidth={1} />
          ))}

          {hover && (
            <g>
              <line x1={hover.sxp} y1={0} x2={hover.sxp} y2={H} stroke="#1A1915" strokeOpacity={0.2} strokeDasharray="3 3" />
              <circle cx={hover.sxp} cy={sy(hover.yPred)} r={4} fill="#C2411C" stroke="#FFFFFF" strokeWidth={1.5} />
            </g>
          )}
        </svg>

        <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] tracking-widest text-faint">x</span>
        <span className="pointer-events-none absolute left-3 top-2 font-mono text-[10px] tracking-widest text-faint">y</span>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded border border-border bg-surface px-3 py-2 font-mono text-[11px] leading-relaxed text-secondary shadow-sm"
            style={{
              left: `calc(${(hover.sxp / W) * 100}% + 14px)`,
              top: '10px',
              transform: hover.sxp > W * 0.62 ? 'translateX(-100%) translateX(-28px)' : undefined,
            }}
          >
            <div>
              x <span className="text-primary">{hover.x.toFixed(2)}</span>
            </div>
            <div>
              pred <span className="text-accent">{hover.yPred.toFixed(3)}</span>
              {'   '}true <span className="text-primary">{hover.yTrue.toFixed(3)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-secondary">
        <span className="flex items-center gap-2">
          <span className="inline-block h-[2.5px] w-5 rounded" style={{ background: '#C2411C' }} /> prediction
        </span>
        <span className="flex items-center gap-2 text-faint">
          <span className="inline-block h-[1.5px] w-5" style={{ background: '#8A8880' }} /> true target
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CLASS_COLORS[0] }} /> train points
        </span>
      </div>
    </div>
  )
}
