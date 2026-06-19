'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RegressionPlot } from '@/components/RegressionPlot'
import {
  CAPACITY_PRESETS,
  CapacityPreset,
  MLPRegressor,
  RegressionPoint,
  Trainer,
  initModel,
  initTrainer,
  makeRegressionData,
  mse,
  paramCount,
  trainStep,
} from '@/lib/capacityModels'

const MODEL_SEED = 42
const MAX_STEPS = 8000
const BASE_STEPS_PER_FRAME = 6
const LR = 0.02

// Snapshot everything the UI needs from the (mutable) trainer so the render
// path never reads a ref. A fresh wrapper object on each call triggers re-render
// even though the underlying model is mutated in place.
type ViewState = {
  model: MLPRegressor
  trainLoss: number
  testLoss: number
  params: number
  steps: number
}

function computeView(trainer: Trainer, train: RegressionPoint[], test: RegressionPoint[]): ViewState {
  return {
    model: trainer.model,
    trainLoss: mse(trainer.model, train),
    testLoss: mse(trainer.model, test),
    params: paramCount(trainer.model),
    steps: trainer.t,
  }
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3.5 py-1.5 font-sans text-[12px] transition-all duration-150"
      style={{
        color: active ? '#FAFAF8' : '#5C5A54',
        backgroundColor: active ? '#C2411C' : 'transparent',
        borderColor: active ? '#C2411C' : '#E4E2DB',
      }}
    >
      {children}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-2.5 last:border-b-0">
      <span className="font-mono text-[11px] uppercase tracking-widest text-faint">{label}</span>
      <span className="font-mono text-[14px] tabular-nums text-primary">{value}</span>
    </div>
  )
}

// Minimal network diagram: a capped, fully-connected sketch of input -> hidden(s) -> output.
function ArchitectureDiagram({ hiddenSizes }: { hiddenSizes: number[] }) {
  const dims = [1, ...hiddenSizes, 1]
  const maxDots = 6
  const colW = 64
  const dotGap = 13
  const width = dims.length * colW
  const height = maxDots * dotGap + 24
  const midY = height / 2

  const cols = dims.map((size, k) => {
    const shown = Math.min(size, maxDots)
    const cx = colW * (k + 0.5)
    const dots = Array.from({ length: shown }, (_, i) => ({
      cx,
      cy: midY + (i - (shown - 1) / 2) * dotGap,
    }))
    return { size, cx, dots, isEdge: k === 0 || k === dims.length - 1 }
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 130 }}>
      {/* connections */}
      {cols.slice(0, -1).map((col, k) =>
        col.dots.map((a, ai) =>
          cols[k + 1].dots.map((b, bi) => (
            <line
              key={`c-${k}-${ai}-${bi}`}
              x1={a.cx}
              y1={a.cy}
              x2={b.cx}
              y2={b.cy}
              stroke="#1A1915"
              strokeOpacity={0.1}
            />
          ))
        )
      )}
      {/* neurons */}
      {cols.map((col, k) => (
        <g key={`col-${k}`}>
          {col.dots.map((d, i) => (
            <circle key={`d-${k}-${i}`} cx={d.cx} cy={d.cy} r={3.5} fill={col.isEdge ? '#C2411C' : '#5C5A54'} />
          ))}
          <text x={col.cx} y={height - 4} textAnchor="middle" className="font-mono" fontSize={9} fill="#8A8880">
            {col.size}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function LayersLab() {
  const data = useMemo(() => makeRegressionData(11), [])
  const [presetId, setPresetId] = useState<string>('linear')
  const preset = CAPACITY_PRESETS.find((p) => p.id === presetId) as CapacityPreset

  const trainerRef = useRef<Trainer>(initTrainer(initModel(preset.hiddenSizes, MODEL_SEED)))
  // Seed the view from a fresh, deterministic init of the same model so the
  // render path never reads the ref. Same seed => identical to the ref's model.
  const [view, setView] = useState<ViewState>(() =>
    computeView(initTrainer(initModel([], MODEL_SEED)), data.train, data.test)
  )
  const [training, setTraining] = useState(false)
  const [speed, setSpeed] = useState(2)
  const rafRef = useRef<number | null>(null)
  const bump = useCallback(() => {
    setView(computeView(trainerRef.current, data.train, data.test))
  }, [data])

  const stopTraining = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setTraining(false)
  }, [])

  const buildModel = useCallback(
    (sizes: number[]) => {
      trainerRef.current = initTrainer(initModel(sizes, MODEL_SEED))
      bump()
    },
    [bump]
  )

  // Rebuild when the capacity preset changes.
  useEffect(() => {
    stopTraining()
    buildModel(preset.hiddenSizes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function doSteps(count: number) {
    const trainer = trainerRef.current
    for (let i = 0; i < count; i++) {
      if (trainer.t >= MAX_STEPS) break
      trainStep(trainer, data.train, LR)
    }
    bump()
  }

  function runTraining() {
    if (training) {
      stopTraining()
      return
    }
    setTraining(true)
    const tick = () => {
      if (trainerRef.current.t >= MAX_STEPS) {
        stopTraining()
        return
      }
      doSteps(BASE_STEPS_PER_FRAME * speed)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function reset() {
    stopTraining()
    buildModel(preset.hiddenSizes)
  }

  function resetAll() {
    stopTraining()
    setPresetId('linear')
    // the preset effect rebuilds the model; if already linear, rebuild directly
    if (presetId === 'linear') buildModel([])
  }

  const { model, trainLoss, testLoss, params, steps } = view

  return (
    <section id="layers" className="border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 py-20">
        <div className="mb-3">
          <span className="mb-3 block font-mono text-xs uppercase tracking-widest text-accent">
            Layers & Neurons
          </span>
          <h2 className="font-sans text-3xl font-semibold leading-tight text-primary md:text-4xl">
            More capacity, more flexible curves.
          </h2>
          <p className="mt-3 max-w-[680px] font-sans text-[17px] leading-relaxed text-secondary">
            More capacity lets a network bend simple pieces into a better approximation.
          </p>
          <p className="mt-4 max-w-[700px] font-serif text-[16px] leading-[1.8] text-secondary">
            Here the network is trying to learn a 1D function from sample points. A linear model can
            only draw a line. Wider and deeper networks can build more flexible curves by combining
            many learned features.
          </p>
        </div>

        {/* controls */}
        <div className="my-8 flex flex-col gap-4 border-y border-border py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[11px] uppercase tracking-widest text-faint">Capacity</span>
            {CAPACITY_PRESETS.map((p) => (
              <Pill key={p.id} active={presetId === p.id} onClick={() => setPresetId(p.id)}>
                {p.label}
              </Pill>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runTraining}
              className="rounded-full border border-accent bg-accent px-3.5 py-1.5 font-sans text-[12px] text-background transition-all duration-150 hover:opacity-90"
            >
              {training ? 'Stop' : 'Train'}
            </button>
            <button
              type="button"
              onClick={() => {
                stopTraining()
                doSteps(1)
              }}
              className="rounded-full border border-border px-3.5 py-1.5 font-sans text-[12px] text-secondary transition-all duration-150 hover:border-secondary hover:text-primary"
            >
              Step once
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-border px-3.5 py-1.5 font-sans text-[12px] text-secondary transition-all duration-150 hover:border-secondary hover:text-primary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-full border border-border px-3.5 py-1.5 font-sans text-[12px] text-secondary transition-all duration-150 hover:border-secondary hover:text-primary"
            >
              Reset all
            </button>
            <label className="ml-2 flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-faint">Speed</span>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
                className="w-24"
                aria-label="training speed"
              />
              <span className="font-mono text-[12px] tabular-nums text-secondary">{speed}x</span>
            </label>
          </div>
        </div>

        {/* plot + side panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded border border-border bg-surface p-5 lg:col-span-3">
            <RegressionPlot model={model} train={data.train} />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded border border-border bg-surface p-6">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-faint">Metrics</p>
              <Stat label="Train loss" value={trainLoss.toFixed(4)} />
              <Stat label="Test loss" value={testLoss.toFixed(4)} />
              <Stat label="Parameters" value={params.toString()} />
              <Stat label="Steps" value={steps.toString()} />
            </div>

            <div className="rounded border border-border bg-surface p-6">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-faint">Architecture</p>
              <ArchitectureDiagram hiddenSizes={preset.hiddenSizes} />
              <p className="mt-3 font-mono text-[12px] text-secondary">
                input 1 {preset.hiddenSizes.map((h) => `to ${h}`).join(' ')} to output 1
              </p>
              <p className="mt-1 font-sans text-[12px] text-faint">{preset.description}</p>
            </div>
          </div>
        </div>

        <p className="mt-8 max-w-[760px] font-serif text-[16px] leading-[1.8] text-secondary">
          A wider layer gives the network more features to combine. More layers let the network
          compose features into more complex shapes. More capacity can fit complex patterns better,
          but it can also overfit if we are not careful: watch the test loss, not just the train
          loss. Capacity helps represent more complex functions, but training, data, regularization,
          and architecture all matter too.
        </p>
        <p className="mt-4 max-w-[760px] font-sans text-[13px] leading-[1.7] text-faint">
          Tiny demo only: a small network trained in the browser on 40 points, meant for intuition
          rather than performance.
        </p>
      </div>
    </section>
  )
}
