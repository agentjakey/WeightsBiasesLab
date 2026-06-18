'use client'

import { motion } from 'framer-motion'

const CARDS = [
  {
    kicker: 'Weights',
    title: 'Direction and importance',
    body: 'w1 and w2 rotate the boundary by changing how much each input matters. Turn one up and that axis dominates; flip its sign and the line swings to the other side.',
  },
  {
    kicker: 'Bias',
    title: 'A parallel slide',
    body: 'b shifts the boundary without changing the relative direction of the weights. It moves the whole line toward one class or the other, so the neuron can sit where the data lives.',
  },
  {
    kicker: 'Learning',
    title: 'Just a search',
    body: 'Learning means searching for weights and biases that fit the data. Each gradient step nudges these three numbers so more points land on the correct side of the line.',
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

export function TeachingCards() {
  return (
    <section id="concepts" className="border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 py-20">
        <span className="mb-3 block font-mono text-xs uppercase tracking-widest text-accent">
          02 / Three knobs
        </span>
        <h2 className="mb-10 font-sans text-3xl font-semibold leading-tight text-primary md:text-4xl">
          What each control does
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
