// Models for the "Activation Functions" tab.
//
// Both compared models share one architecture: input 2 -> hidden 8 -> output 1,
// trained with batch gradient descent on binary cross-entropy. The ONLY
// difference is the hidden activation:
//
//   - "none" (identity): hidden = W1 x + b1 is linear, so the whole network
//     collapses to sigmoid(W2 W1 x + ...), i.e. a single linear classifier. It
//     can only ever draw a straight boundary, no matter how many layers.
//   - "tanh" / "relu": a real nonlinearity sits between the layers, so the
//     network can bend the boundary and fit curved data.
//
// mlpForward is the single source of truth for the field, boundary, point
// predictions, metrics, and hover readout on this tab. sigmoid is imported from
// neuron.ts so the squashing function is shared with the first tab.

import { sigmoid } from '@/lib/neuron'

export type Point = { x1: number; x2: number; y: 0 | 1 }

export type Activation = 'none' | 'tanh' | 'relu'

export type MLPModel = {
  W1: number[][] // [hidden][2]
  b1: number[] // [hidden]
  W2: number[] // [hidden]
  b2: number
}

export type MLPForward = {
  z: number
  pre: number[]
  hidden: number[]
  yHat: number
  prediction: 0 | 1
}

export const HIDDEN_UNITS = 8
export const DOMAIN = 3.2 // plot spans x1, x2 in [-DOMAIN, DOMAIN]

export const ACTIVATION_LR: Record<Activation, number> = {
  none: 0.4,
  tanh: 0.6,
  relu: 0.2,
}

export const ACTIVATION_LABELS: Record<Activation, string> = {
  none: 'None',
  tanh: 'tanh',
  relu: 'ReLU',
}

export type DatasetKind = 'moons' | 'circles' | 'xor'

export const DATASET_LABELS: Record<DatasetKind, string> = {
  moons: 'Moons',
  circles: 'Circles',
  xor: 'XOR',
}

function act(a: Activation, x: number): number {
  if (a === 'tanh') return Math.tanh(x)
  if (a === 'relu') return x > 0 ? x : 0
  return x // identity
}

// Derivative of the activation, given the pre-activation and its output.
function actDeriv(a: Activation, pre: number, out: number): number {
  if (a === 'tanh') return 1 - out * out
  if (a === 'relu') return pre > 0 ? 1 : 0
  return 1 // identity
}

export function mlpForward(
  x1: number,
  x2: number,
  model: MLPModel,
  activation: Activation
): MLPForward {
  const h = model.b1.length
  const pre = new Array<number>(h)
  const hidden = new Array<number>(h)
  let z = model.b2
  for (let j = 0; j < h; j++) {
    const p = model.W1[j][0] * x1 + model.W1[j][1] * x2 + model.b1[j]
    pre[j] = p
    const o = act(activation, p)
    hidden[j] = o
    z += model.W2[j] * o
  }
  const yHat = sigmoid(z)
  return { z, pre, hidden, yHat, prediction: yHat >= 0.5 ? 1 : 0 }
}

// Deterministic RNG (linear congruential) so the demo is reproducible.
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function initMLP(seed: number, hidden = HIDDEN_UNITS): MLPModel {
  const rng = makeRng(seed)
  const uniform = () => (rng() * 2 - 1) * 0.8
  const W1: number[][] = []
  const b1: number[] = []
  const W2: number[] = []
  for (let j = 0; j < hidden; j++) {
    W1.push([uniform(), uniform()])
    b1.push(0)
    W2.push(uniform())
  }
  return { W1, b1, W2, b2: 0 }
}

// One step of batch gradient descent on binary cross-entropy. The gradient of
// the loss w.r.t. the output pre-activation z is (yHat - y), which is why this
// reuses mlpForward directly.
export function mlpTrainStep(
  model: MLPModel,
  points: Point[],
  activation: Activation,
  lr: number
): MLPModel {
  const h = model.b1.length
  const gW1 = model.W1.map(() => [0, 0])
  const gb1 = new Array<number>(h).fill(0)
  const gW2 = new Array<number>(h).fill(0)
  let gb2 = 0

  for (const p of points) {
    const f = mlpForward(p.x1, p.x2, model, activation)
    const dz = f.yHat - p.y
    gb2 += dz
    for (let j = 0; j < h; j++) {
      gW2[j] += dz * f.hidden[j]
      const dh = dz * model.W2[j]
      const dpre = dh * actDeriv(activation, f.pre[j], f.hidden[j])
      gb1[j] += dpre
      gW1[j][0] += dpre * p.x1
      gW1[j][1] += dpre * p.x2
    }
  }

  const n = points.length
  const W1 = model.W1.map((row, j) => [
    row[0] - (lr * gW1[j][0]) / n,
    row[1] - (lr * gW1[j][1]) / n,
  ])
  const b1 = model.b1.map((v, j) => v - (lr * gb1[j]) / n)
  const W2 = model.W2.map((v, j) => v - (lr * gW2[j]) / n)
  const b2 = model.b2 - (lr * gb2) / n
  return { W1, b1, W2, b2 }
}

export function metrics(
  points: Point[],
  forward: (x1: number, x2: number) => { yHat: number; prediction: 0 | 1 }
): { acc: number; loss: number } {
  if (points.length === 0) return { acc: 0, loss: 0 }
  const eps = 1e-7
  let correct = 0
  let loss = 0
  for (const p of points) {
    const { yHat, prediction } = forward(p.x1, p.x2)
    if (prediction === p.y) correct += 1
    const q = Math.min(1 - eps, Math.max(eps, yHat))
    loss += -(p.y * Math.log(q) + (1 - p.y) * Math.log(1 - q))
  }
  return { acc: correct / points.length, loss: loss / points.length }
}

// Deterministic, seeded datasets scaled to roughly fit [-DOMAIN, DOMAIN].
export function makeDataset(kind: DatasetKind, seed = 7, n = 90): Point[] {
  const rng = makeRng(seed)
  const gauss = () => {
    // Box-Muller from the seeded uniform stream.
    const u1 = Math.max(rng(), 1e-9)
    const u2 = rng()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
  const pts: Point[] = []
  const half = Math.floor(n / 2)

  if (kind === 'moons') {
    const scale = 2.0
    for (let i = 0; i < half; i++) {
      const t = (Math.PI * i) / (half - 1)
      // upper moon -> class 0
      pts.push({
        x1: (Math.cos(t) - 0.5) * scale + gauss() * 0.18,
        x2: (Math.sin(t) - 0.25) * scale + gauss() * 0.18,
        y: 0,
      })
      // lower moon -> class 1
      pts.push({
        x1: (1 - Math.cos(t) - 0.5) * scale + gauss() * 0.18,
        x2: (0.5 - Math.sin(t) - 0.25) * scale + gauss() * 0.18,
        y: 1,
      })
    }
  } else if (kind === 'circles') {
    for (let i = 0; i < half; i++) {
      const a0 = rng() * 2 * Math.PI
      const a1 = rng() * 2 * Math.PI
      // inner blob -> class 0
      const ri = 0.6 + gauss() * 0.12
      pts.push({ x1: Math.cos(a0) * ri, x2: Math.sin(a0) * ri, y: 0 })
      // outer ring -> class 1
      const ro = 2.2 + gauss() * 0.14
      pts.push({ x1: Math.cos(a1) * ro, x2: Math.sin(a1) * ro, y: 1 })
    }
  } else {
    // XOR: quadrants I and III are class 1, II and IV are class 0.
    const centers: { cx: number; cy: number; y: 0 | 1 }[] = [
      { cx: 1.5, cy: 1.5, y: 1 },
      { cx: -1.5, cy: -1.5, y: 1 },
      { cx: -1.5, cy: 1.5, y: 0 },
      { cx: 1.5, cy: -1.5, y: 0 },
    ]
    const per = Math.floor(n / 4)
    for (const c of centers) {
      for (let i = 0; i < per; i++) {
        pts.push({ x1: c.cx + gauss() * 0.45, x2: c.cy + gauss() * 0.45, y: c.y })
      }
    }
  }
  return pts
}

// Marching squares: extract the iso = 0.5 contour from a grid of probabilities.
// values is indexed [row][col]; row 0 is the top of the plot (x2 = +DOMAIN).
// Returned segment coordinates are in fractional grid units [0, gridSize].
export function contourSegments(
  values: number[][],
  iso = 0.5
): { x1: number; y1: number; x2: number; y2: number }[] {
  const segs: { x1: number; y1: number; x2: number; y2: number }[] = []
  const R = values.length - 1
  const C = values[0].length - 1
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const tl = values[r][c]
      const tr = values[r][c + 1]
      const br = values[r + 1][c + 1]
      const bl = values[r + 1][c]
      const pts: { x: number; y: number }[] = []
      if ((tl - iso) * (tr - iso) < 0) pts.push({ x: c + (iso - tl) / (tr - tl), y: r })
      if ((tr - iso) * (br - iso) < 0) pts.push({ x: c + 1, y: r + (iso - tr) / (br - tr) })
      if ((bl - iso) * (br - iso) < 0) pts.push({ x: c + (iso - bl) / (br - bl), y: r + 1 })
      if ((tl - iso) * (bl - iso) < 0) pts.push({ x: c, y: r + (iso - tl) / (bl - tl) })
      if (pts.length === 2) {
        segs.push({ x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y })
      } else if (pts.length === 4) {
        segs.push({ x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y })
        segs.push({ x1: pts[2].x, y1: pts[2].y, x2: pts[3].x, y2: pts[3].y })
      }
    }
  }
  return segs
}
