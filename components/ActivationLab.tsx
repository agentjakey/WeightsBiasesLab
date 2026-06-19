'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivationModelView } from '@/components/ActivationModelView'
import {
  ACTIVATION_LABELS,
  ACTIVATION_LR,
  Activation,
  DATASET_LABELS,
  DatasetKind,
  MLPModel,
  Point,
  initMLP,
  makeDataset,
  metrics,
  mlpForward,
  mlpTrainStep,
} from '@/lib/activationModels'

const SEED_A = 1
const SEED_B = 2
const DATASET_SEED = 7
const MAX_STEPS = 700
const STEPS_PER_FRAME = 4

const DATASETS: DatasetKind[] = ['moons', 'circles', 'xor']
const ACTIVATIONS: Activation[] = ['tanh', 'relu']

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
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

function Metrics({ acc, loss }: { acc: number; loss: number }) {
  return (
    <p className="font-mono text-[12px] tabular-nums text-secondary">
      acc <span className="text-primary">{acc.toFixed(2)}</span>
      {'   '}loss <span className="text-primary">{loss.toFixed(3)}</span>
    </p>
  )
}

export function ActivationLab() {
  const [dataset, setDataset] = useState<DatasetKind>('moons')
  const [activation, setActivation] = useState<Activation>('tanh')
  const [points, setPoints] = useState<Point[]>(() => makeDataset('moons', DATASET_SEED))
  const [modelA, setModelA] = useState<MLPModel>(() => initMLP(SEED_A))
  const [modelB, setModelB] = useState<MLPModel>(() => initMLP(SEED_B))
  const [training, setTraining] = useState(false)
  const [steps, setSteps] = useState(0)
  const rafRef = useRef<number | null>(null)
  const stepsRef = useRef(0)

  const stopTraining = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setTraining(false)
  }, [])

  // Rebuild data and reinitialize both models whenever the dataset or the
  // activation changes, so every comparison starts from the same clean state.
  useEffect(() => {
    stopTraining()
    setPoints(makeDataset(dataset, DATASET_SEED))
    setModelA(initMLP(SEED_A))
    setModelB(initMLP(SEED_B))
    stepsRef.current = 0
    setSteps(0)
  }, [dataset, activation, stopTraining])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const trainBatch = useCallback(
    (count: number) => {
      setModelA((m) => {
        let next = m
        for (let i = 0; i < count; i++) next = mlpTrainStep(next, points, 'none', ACTIVATION_LR.none)
        return next
      })
      setModelB((m) => {
        let next = m
        for (let i = 0; i < count; i++)
          next = mlpTrainStep(next, points, activation, ACTIVATION_LR[activation])
        return next
      })
      stepsRef.current += count
      setSteps(stepsRef.current)
    },
    [points, activation]
  )

  function runTraining() {
    if (training) {
      stopTraining()
      return
    }
    setTraining(true)
    const tick = () => {
      if (stepsRef.current >= MAX_STEPS) {
        stopTraining()
        return
      }
      trainBatch(STEPS_PER_FRAME)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function reset() {
    stopTraining()
    setModelA(initMLP(SEED_A))
    setModelB(initMLP(SEED_B))
    stepsRef.current = 0
    setSteps(0)
  }

  const forwardA = (x1: number, x2: number) => mlpForward(x1, x2, modelA, 'none')
  const forwardB = (x1: number, x2: number) => mlpForward(x1, x2, modelB, activation)

  const mA = metrics(points, forwardA)
  const mB = metrics(points, forwardB)

  return (
    <section id="activation" className="border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 py-20">
        <div className="mb-3">
          <span className="mb-3 block font-mono text-xs uppercase tracking-widest text-accent">
            Activation Functions
          </span>
          <h2 className="font-sans text-3xl font-semibold leading-tight text-primary md:text-4xl">
            Same data. One line, one curve.
          </h2>
          <p className="mt-3 max-w-[680px] font-sans text-[17px] leading-relaxed text-secondary">
            Same data. Same training goal. One model can only draw a line. The other can bend.
          </p>
        </div>

        {/* controls */}
        <div className="my-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-border py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[11px] uppercase tracking-widest text-faint">Data</span>
            {DATASETS.map((d) => (
              <Pill key={d} active={dataset === d} onClick={() => setDataset(d)}>
                {DATASET_LABELS[d]}
              </Pill>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[11px] uppercase tracking-widest text-faint">
              Activation
            </span>
            {ACTIVATIONS.map((a) => (
              <Pill key={a} active={activation === a} onClick={() => setActivation(a)}>
                {ACTIVATION_LABELS[a]}
              </Pill>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
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
                trainBatch(1)
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
          </div>
        </div>

        {/* side-by-side comparison */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded border border-border bg-surface p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <span className="block font-mono text-[11px] uppercase tracking-widest text-accent">
                  No activation
                </span>
                <h3 className="mt-1 font-sans text-lg font-semibold text-primary">
                  Linear boundary
                </h3>
              </div>
              <Metrics acc={mA.acc} loss={mA.loss} />
            </div>
            <ActivationModelView forward={forwardA} points={points} />
          </div>

          <div className="rounded border border-border bg-surface p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <span className="block font-mono text-[11px] uppercase tracking-widest text-accent">
                  With activation ({ACTIVATION_LABELS[activation]})
                </span>
                <h3 className="mt-1 font-sans text-lg font-semibold text-primary">
                  Curved boundary
                </h3>
              </div>
              <Metrics acc={mB.acc} loss={mB.loss} />
            </div>
            <ActivationModelView forward={forwardB} points={points} />
          </div>
        </div>

        <p className="mt-6 font-mono text-[12px] text-faint">
          {steps} training steps &middot; input 2 to hidden 8 to output 1 &middot; batch gradient
          descent on cross-entropy
        </p>

        {/* explanation + honest note */}
        <p className="mt-8 max-w-[760px] font-serif text-[16px] leading-[1.8] text-secondary">
          Linear layers alone cannot create curved decision boundaries. A nonlinear activation
          changes that: it lets the network build more flexible internal features before making a
          prediction. Without activation functions, stacked linear layers collapse into one linear
          transformation. This is one reason depth becomes useful.
        </p>
        <p className="mt-4 max-w-[760px] font-sans text-[13px] leading-[1.7] text-faint">
          Tiny demo only: this is a small 2D network trained in the browser, meant for intuition
          rather than performance.
        </p>
      </div>
    </section>
  )
}
