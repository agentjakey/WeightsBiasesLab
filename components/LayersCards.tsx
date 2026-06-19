'use client'

import { motion } from 'framer-motion'

const CARDS = [
  {
    kicker: 'Linear',
    title: 'One straight trend',
    body: 'Useful, but limited to one straight trend. A linear model cannot bend toward the wiggles in the data.',
  },
  {
    kicker: 'More neurons',
    title: 'More features',
    body: 'A wider layer gives the model more learned features to combine, so it can shape a richer curve.',
  },
  {
    kicker: 'More layers',
    title: 'Composed features',
    body: 'Depth lets the model compose features into features, building more complex patterns from simple parts.',
  },
  {
    kicker: 'Tradeoff',
    title: 'Capacity is not free',
    body: 'More capacity can help, but it can also overfit noisy data. Deeper is not always better; data and training matter.',
  },
]

const item = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

export function LayersCards() {
  return (
    <section id="layers-concepts" className="border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 py-20">
        <span className="mb-3 block font-mono text-xs uppercase tracking-widest text-accent">
          Capacity, carefully
        </span>
        <h2 className="mb-10 font-sans text-3xl font-semibold leading-tight text-primary md:text-4xl">
          What more capacity buys, and costs
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
