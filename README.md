# Weights & Biases Lab

A tiny neuron. Three sliders. One moving decision boundary.

An interactive companion demo for the lecture slide **"Why weights and biases?"**
(Week 2A: Why Neural Networks?). Drop the deployed link into the slide where the
empty box is, and let students drag the sliders during the talk.

## What it teaches

A single neuron computes:

```
z    = w1 * x1 + w2 * x2 + b
yhat = sigmoid(z)
```

This is a real one-neuron logistic classifier, not a full neural network. It
predicts class 1 when `z > 0`. A single `neuronForward(x1, x2, weights)` function
is the source of truth for the probability field, the sample-point predictions,
the hover readout, the accuracy meter, and the decision boundary. The lab makes
three ideas tangible:

- **Weights** (`w1`, `w2`) rotate the boundary by changing how much each input matters.
- **Bias** (`b`) shifts the boundary without changing the relative direction of the weights.
- **Learning** means searching for weights and biases that fit the data.

Move the sliders and the soft probability field, the `z = 0` boundary, the live
equation, and the fit-on-samples score all update immediately. Hover anywhere on
the plane to read `x1`, `x2`, `z`, and `sigmoid(z)` at that point. Presets
(Reset, Rotate boundary, Shift boundary, Good fit, Bad fit) jump to instructive
configurations, and **Train (gradient descent)** runs a short animated batch of
real gradient descent on the fixed samples so you can watch the boundary settle.

Larger neural networks are built by stacking many units exactly like this one.

## Stack

Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS 3, framer-motion.
Same conventions as the sibling project Failure Mode Atlas, including its exact
color palette (cream `#FAFAF8` background, rust `#C2411C` accent, `#E4E2DB`
borders, Sora / Lora / DM Mono type). No data layer, no backend, no extra
dependencies. The visualization is a 2D canvas probability field with an SVG
overlay.

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
