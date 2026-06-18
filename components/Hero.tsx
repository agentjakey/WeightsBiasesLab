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

export function Hero() {
  return (
    <section id="hero" className="border-b border-border">
      <motion.div
        className="mx-auto px-8"
        style={{ maxWidth: '720px', paddingTop: '120px', paddingBottom: '80px' }}
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

        <motion.div variants={item}>
          <h1
            className="font-sans font-bold text-primary"
            style={{ fontSize: '64px', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            Weights &amp; Biases Lab
          </h1>
          <p
            className="font-sans font-normal text-secondary"
            style={{ fontSize: '22px', marginTop: '14px', lineHeight: 1.4 }}
          >
            A single neuron. Three sliders. One moving decision boundary.
          </p>
        </motion.div>

        <motion.p
          variants={item}
          className="font-serif italic text-secondary"
          style={{ fontSize: '17px', lineHeight: 1.7, marginTop: '36px', marginBottom: '20px' }}
        >
          &ldquo;Move the sliders. Watch a neuron redraw its decision boundary.&rdquo;
        </motion.p>

        <motion.p
          variants={item}
          className="font-serif text-primary"
          style={{ fontSize: '19px', lineHeight: 1.85 }}
        >
          This is the smallest piece of a neural network: a single neuron computes z = w
          <sub>1</sub>x<sub>1</sub> + w<sub>2</sub>x<sub>2</sub> + b, then squashes it with a sigmoid
          to get a probability. The weights set the direction and importance of each input. The bias
          slides the line. Together they are everything this neuron can learn, and stacking many of
          them is how larger networks are built.
        </motion.p>

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
            ~3 min &middot; nothing to install
          </span>
        </motion.div>
      </motion.div>
    </section>
  )
}
