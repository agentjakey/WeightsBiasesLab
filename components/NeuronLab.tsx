'use client'

import { useEffect, useRef, useState } from 'react'
import { NeuronPlot } from '@/components/NeuronPlot'
import {
  DEFAULT_WEIGHTS,
  PRESETS,
  SAMPLES,
  Weights,
  countCorrect,
  trainStep,
} from '@/lib/neuron'

type SliderKey = keyof Weights

const SLIDERS: { key: SliderKey; label: React.ReactNode; hint: string }[] = [
  { key: 'w1', label: <>w<sub>1</sub></>, hint: 'importance of x1' },
  { key: 'w2', label: <>w<sub>2</sub></>, hint: 'importance of x2' },
  { key: 'b', label: <>b</>, hint: 'boundary shift' },
]

function fmt(v: number) {
  return v.toFixed(2)
}

// Shared pill button styling, matching FailModeAtlas AudienceTrack pills.
const pillClass =
  'rounded-full border border-border bg-transparent px-3.5 py-1.5 font-sans text-[12px] text-secondary transition-all duration-150 hover:border-secondary hover:text-primary disabled:opacity-50'

function Slider({
  label,
  hint,
  value,
  onChange,
}: {
  label: React.ReactNode
  hint: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[15px] text-primary">{label}</span>
          <span className="font-sans text-[11px] text-faint">{hint}</span>
        </div>
        <span className="font-mono text-[14px] tabular-nums text-accent">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={-5}
        max={5}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={hint}
      />
    </div>
  )
}

export function NeuronLab() {
  const [w, setW] = useState<Weights>(DEFAULT_WEIGHTS)
  const [training, setTraining] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const correct = countCorrect(w)
  const total = SAMPLES.length
  const pct = Math.round((correct / total) * 100)

  const set = (key: SliderKey) => (v: number) => {
    stopTraining()
    setW((prev) => ({ ...prev, [key]: v }))
  }

  function stopTraining() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setTraining(false)
  }

  function applyPreset(weights: Weights) {
    stopTraining()
    setW(weights)
  }

  // Animate a short run of batch gradient descent on the fixed samples.
  function runTraining() {
    if (training) {
      stopTraining()
      return
    }
    setTraining(true)
    const maxSteps = 80
    let step = 0
    const tick = () => {
      setW((prev) => trainStep(prev))
      step += 1
      if (step >= maxSteps) {
        rafRef.current = null
        setTraining(false)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const sign = (v: number) => (v >= 0 ? '+' : '-')
  const abs = (v: number) => Math.abs(v).toFixed(2)

  return (
    <section id="lab" className="border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 py-20">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 block font-mono text-xs uppercase tracking-widest text-accent">
              01 / The Lab
            </span>
            <h2 className="font-sans text-3xl font-semibold leading-tight text-primary md:text-4xl">
              One neuron, drawing a line
            </h2>
          </div>

          {/* presets */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => applyPreset(p.weights)} className={pillClass}>
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={runTraining}
              className="rounded-full border border-accent bg-accent px-3.5 py-1.5 font-sans text-[12px] text-background transition-all duration-150 hover:opacity-90"
            >
              {training ? 'Stop' : 'Train (gradient descent)'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* visualization */}
          <div className="rounded border border-border bg-surface p-5 lg:col-span-3">
            <NeuronPlot weights={w} />
          </div>

          {/* controls */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded border border-border bg-surface p-6">
              <p className="mb-5 font-mono text-[11px] uppercase tracking-widest text-faint">
                Parameters
              </p>
              <div className="flex flex-col gap-6">
                {SLIDERS.map((s) => (
                  <Slider
                    key={s.key}
                    label={s.label}
                    hint={s.hint}
                    value={w[s.key]}
                    onChange={set(s.key)}
                  />
                ))}
              </div>
            </div>

            {/* equation */}
            <div className="rounded border border-border bg-surface p-6">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-faint">
                Live equation
              </p>
              <p className="font-mono text-[15px] leading-relaxed text-primary md:text-[16px]">
                z = {fmt(w.w1)}x<sub>1</sub> {sign(w.w2)} {abs(w.w2)}x<sub>2</sub> {sign(w.b)}{' '}
                {abs(w.b)}
              </p>
              <p className="mt-2 font-mono text-[13px] text-secondary">y&#770; = sigmoid(z)</p>
              <p className="mt-4 border-t border-border pt-4 font-serif text-[14px] italic leading-relaxed text-secondary">
                The model predicts class 1 when z &gt; 0.
              </p>
            </div>

            {/* accuracy */}
            <div className="rounded border border-border bg-surface p-6">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="font-mono text-[11px] uppercase tracking-widest text-faint">
                  Fit on samples
                </p>
                <p className="font-mono text-[14px] tabular-nums text-primary">
                  {correct} / {total} correct
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* honest accuracy note */}
        <p className="mt-8 max-w-[760px] font-serif text-[15px] leading-[1.75] text-secondary">
          This is a real one-neuron logistic model: z = w<sub>1</sub>x<sub>1</sub> + w
          <sub>2</sub>x<sub>2</sub> + b, followed by sigmoid(z). The probability field, the sample
          predictions, the hover readout, and the boundary all come from the same forward pass.
          Larger neural networks are built by stacking many units like this.
        </p>
      </div>
    </section>
  )
}
