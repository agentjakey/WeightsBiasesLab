'use client'

import { useState } from 'react'
import { NeuronLab } from '@/components/NeuronLab'
import { TeachingCards } from '@/components/TeachingCards'
import { ActivationLab } from '@/components/ActivationLab'
import { ActivationCards } from '@/components/ActivationCards'
import { LayersLab } from '@/components/LayersLab'
import { LayersCards } from '@/components/LayersCards'

type Tab = 'weights' | 'activation' | 'layers'

const TABS: { id: Tab; label: string }[] = [
  { id: 'weights', label: 'Weights & Biases' },
  { id: 'activation', label: 'Activation Functions' },
  { id: 'layers', label: 'Layers & Neurons' },
]

export function LabTabs() {
  const [tab, setTab] = useState<Tab>('weights')

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-2 px-6 py-3">
          <span className="mr-2 font-mono text-[11px] uppercase tracking-widest text-faint">
            Lab
          </span>
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="rounded-full border px-4 py-1.5 font-sans text-[13px] transition-all duration-150"
                style={{
                  color: active ? '#FAFAF8' : '#5C5A54',
                  backgroundColor: active ? '#C2411C' : 'transparent',
                  borderColor: active ? '#C2411C' : '#E4E2DB',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'weights' && (
        <>
          <NeuronLab />
          <TeachingCards />
        </>
      )}
      {tab === 'activation' && (
        <>
          <ActivationLab />
          <ActivationCards />
        </>
      )}
      {tab === 'layers' && (
        <>
          <LayersLab />
          <LayersCards />
        </>
      )}
    </>
  )
}
