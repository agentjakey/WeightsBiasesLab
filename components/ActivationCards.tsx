'use client'

import { motion } from 'framer-motion'

const CARDS = [
  {
    kicker: 'No activation',
    title: 'Still just a line',
    body: 'Stacked linear operations still behave like one linear operation. No matter how many layers, the boundary stays straight.',
  },
  {
    kicker: 'With activation',
    title: 'Bend and combine',
    body: 'Nonlinear functions let the network bend and combine features. The hidden units carve the plane into pieces the output can stitch together.',
  },
  {
    kicker: 'Why it matters',
    title: 'Approximating complexity',
    body: 'This is what lets neural networks approximate complex patterns instead of only simple lines. Depth and nonlinearity work together.',
  },
]

const item = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

export function ActivationCards() {
  return (
    <section id="activation-concepts" className="border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 py-20">
        <span className="mb-3 block font-mono text-xs uppercase tracking-widest text-accent">
          Why nonlinearity
        </span>
        <h2 className="mb-10 font-sans text-3xl font-semibold leading-tight text-primary md:text-4xl">
          What the activation buys you
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.kicker}
              custom={i}
              variants={item}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="rounded border border-border bg-surface p-6 transition-colors duration-200 hover:border-secondary"
            >
              <span className="mb-4 inline-block font-mono text-[11px] uppercase tracking-widest text-accent">
                {c.kicker}
              </span>
              <h3 className="mb-3 font-sans text-lg font-semibold text-primary">{c.title}</h3>
              <p className="font-serif text-[15px] leading-[1.75] text-secondary">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
