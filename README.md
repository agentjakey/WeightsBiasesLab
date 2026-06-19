# [Weights & Biases Lab ](https://weights-biases-lab.vercel.app/)


A small, hands-on companion lab for an intro neural-networks lecture
(Week 2A: Why Neural Networks?). Drop the deployed link into the slide where the
empty box is and click through it live. Every visualization is driven by a real
forward pass and real training, never a faked animation.

The lab has three tabs, each the next concept in the sequence.

## Tab 1 - Weights & Biases

A single neuron computes:

```
z    = w1 * x1 + w2 * x2 + b
yhat = sigmoid(z)
```

A real one-neuron logistic classifier (not a full network). `neuronForward(x1, x2, weights)`
in `lib/neuron.ts` is the single source of truth for the probability field, the
sample-point predictions, the hover readout, the accuracy meter, and the `z = 0`
boundary. Three sliders move the boundary live; presets (Reset, Rotate, Shift,
Good fit, Bad fit) and a **Train (gradient descent)** button make weights and
bias tangible.

- **Weights** (`w1`, `w2`) rotate the boundary by changing how much each input matters.
- **Bias** (`b`) shifts the boundary without changing the relative direction of the weights.
- **Learning** means searching for weights and biases that fit the data.

## Tab 2 - Activation Functions

Two networks with the **same** architecture (input 2 to hidden 8 to output 1),
trained side by side on a curved dataset (Moons / Circles / XOR). The only
difference is the hidden activation:

- **No activation** (identity): stacked linear layers collapse into one linear
  transformation, so it can only ever draw a straight boundary.
- **With activation** (tanh / ReLU): a real nonlinearity lets the network bend
  the boundary and fit the curve.

`lib/activationModels.ts` implements `mlpForward` plus real backprop / batch
gradient descent on cross-entropy. The decision boundary is the true iso-0.5
contour of the forward pass (marching squares), not a drawn shape.

## Tab 3 - Layers & Neurons

A 1D function-approximation demo: the network learns a fixed target
`y = 0.55 sin(2.2x) + 0.28 sin(5.7x) + 0.12x` from seeded sample points. A
capacity selector (Linear, 1x4, 1x16, 2x16, 3x32) swaps in real MLP regressors
with tanh hidden layers and a linear output, trained with backprop + Adam in
`lib/capacityModels.ts`. The prediction curve, train/test loss, and parameter
count are all computed from the live model.

The teaching outcome is emergent, not scripted: the linear model underfits, more
neurons fit better, and the largest model (3x32, ~2,200 params) reaches the
lowest **train** loss but a higher **test** loss than the 16-neuron model - a
real overfitting signal. More capacity helps represent complex functions, but it
is not free, and deeper is not always better.

## Stack

Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS 3, framer-motion.
Same conventions as the sibling project Failure Mode Atlas, including its exact
color palette (cream `#FAFAF8` background, rust `#C2411C` accent, `#E4E2DB`
borders, Sora / Lora / DM Mono type). No data layer, no backend, no extra
dependencies. Classification fields are a 2D canvas probability field with an SVG
overlay; the regression view is SVG curves. All model math is plain TypeScript.

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## Deploy to Vercel

This app is self-contained and deploys as an independent Vercel project from the
`python/WeightsBiasesLab` folder.

Dashboard:

1. New Project, import the repository.
2. Set **Root Directory** to `python/WeightsBiasesLab`.
3. Framework preset auto-detects as Next.js. Defaults are correct
   (`npm run build`, output handled by Next).
4. Deploy.

CLI (from inside `python/WeightsBiasesLab`):

```bash
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

## Slide use

Once deployed, link the Vercel URL from the "Why weights and biases?" slide in
place of the empty box. The page is presentation-ready and sized for screen
sharing, so it works as a live click-through during the lecture.
