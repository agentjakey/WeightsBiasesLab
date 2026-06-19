'use client'

import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const PARTS = [
  {
    n: 'Part 1',
    title: 'Weights & Biases',
    body: 'A single neuron and the decision boundary it draws.',
  },
  {
    n: 'Part 2',
    title: 'Activation Functions',
    body: 'Why nonlinearity lets a network bend, not just tilt.',
  },
  {
    n: 'Part 3',
    title: 'Layers & Neurons',
    body: 'How capacity helps approximate more complex patterns.',
  },
]

export function Hero() {
  return (
    <section id="hero" className="border-b border-border">
      <motion.div
        className="mx-auto max-w-[1100px] px-6"
        style={{ paddingTop: '120px', paddingBottom: '72px' }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.p
          variants={item}
          className="font-mono text-accent"
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '32px',
          }}
        >
          Week 2A &middot; Why Neural Networks?
        </motion.p>

        <motion.div variants={item} style={{ maxWidth: '760px' }}>
          <h1
            className="font-sans font-bold text-primary"
            style={{ fontSize: '64px', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            Neural Network Foundations Lab
          </h1>
          <p
            className="font-sans font-normal text-secondary"
            style={{ fontSize: '22px', marginTop: '16px', lineHeight: 1.45 }}
          >
            Three small interactive demos for building intuition around neurons, nonlinearity, and
            model capacity.
          </p>
        </motion.div>

        <motion.p
          variants={item}
          className="font-serif text-primary"
          style={{ fontSize: '19px', lineHeight: 1.85, marginTop: '32px', maxWidth: '720px' }}
        >
          Explore weights and biases, activation functions, and the effect of adding more layers and
          neurons. Each section is a real model running in the browser, not a canned animation, so
          you can move the controls and watch the math respond.
        </motion.p>

        {/* three-part summary row */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 gap-x-6 gap-y-6 border-t border-border sm:grid-cols-3"
          style={{ marginTop: '40px', paddingTop: '32px' }}
        >
          {PARTS.map((p) => (
            <div key={p.n}>
              <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
                {p.n}
              </span>
              <h2 className="mt-2 font-sans text-[17px] font-semibold text-primary">{p.title}</h2>
              <p className="mt-1.5 font-serif text-[14px] leading-[1.6] text-secondary">{p.body}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          variants={item}
          className="flex flex-wrap items-center gap-4 border-t border-border"
          style={{ marginTop: '40px', paddingTop: '32px' }}
        >
          <a
            href="#lab"
            className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[12px] text-background transition-all duration-150 hover:opacity-90"
          >
            Open the lab
          </a>
          <span className="font-sans text-secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
            3 interactive sections &middot; ~5 min &middot; nothing to install
          </span>
        </motion.div>
      </motion.div>
    </section>
  )
}
