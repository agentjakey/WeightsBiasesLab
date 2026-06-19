// Models for the "Layers & Neurons" tab: 1D function approximation with a real
// MLP regressor trained by backpropagation + Adam.
//
//   input x (scalar) -> [hidden layers, tanh] -> linear output (scalar)
//
// The prediction curve, the train/test losses, and the parameter count are all
// computed from these functions. Nothing about the curve is interpolated or
// faked; it is the genuine forward pass of a network trained on fixed points.

export type RegressionPoint = { x: number; y: number }

// W is [outDim][inDim]; b is [outDim].
export type DenseLayer = { W: number[][]; b: number[] }

export type MLPRegressor = { layers: DenseLayer[] }

export type CapacityPreset = {
  id: string
  label: string
  hiddenSizes: number[]
  description: string
}

export const CAPACITY_PRESETS: CapacityPreset[] = [
  { id: 'linear', label: 'Linear model', hiddenSizes: [], description: 'A single straight line.' },
  { id: 'h4', label: '1 layer / 4 neurons', hiddenSizes: [4], description: 'A few learned features.' },
  { id: 'h16', label: '1 layer / 16 neurons', hiddenSizes: [16], description: 'Many features to combine.' },
  { id: 'h16x2', label: '2 layers / 16 neurons', hiddenSizes: [16, 16], description: 'Features composed into features.' },
  { id: 'h32x3', label: '3 layers / 32 neurons', hiddenSizes: [32, 32, 32], description: 'High capacity, watch for overfit.' },
]

// The fixed target the network is trying to learn.
export function targetFn(x: number): number {
  return 0.55 * Math.sin(2.2 * x) + 0.28 * Math.sin(5.7 * x) + 0.12 * x
}

export const X_MIN = -3
export const X_MAX = 3
export const Y_MIN = -1.7
export const Y_MAX = 1.7

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function initModel(hiddenSizes: number[], seed: number): MLPRegressor {
  const rng = makeRng(seed)
  const dims = [1, ...hiddenSizes, 1]
  const layers: DenseLayer[] = []
  for (let li = 0; li < dims.length - 1; li++) {
    const inDim = dims[li]
    const outDim = dims[li + 1]
    // Xavier/Glorot uniform initialization, good for tanh.
    const limit = Math.sqrt(6 / (inDim + outDim))
    const W: number[][] = []
    for (let o = 0; o < outDim; o++) {
      const row: number[] = []
      for (let i = 0; i < inDim; i++) row.push((rng() * 2 - 1) * limit)
      W.push(row)
    }
    layers.push({ W, b: new Array<number>(outDim).fill(0) })
  }
  return { layers }
}

export function paramCount(model: MLPRegressor): number {
  let n = 0
  for (const layer of model.layers) {
    n += layer.b.length
    for (const row of layer.W) n += row.length
  }
  return n
}

// Forward pass. Hidden layers use tanh; the output layer is linear.
export function predict(model: MLPRegressor, x: number): number {
  let a = [x]
  const L = model.layers.length
  for (let li = 0; li < L; li++) {
    const layer = model.layers[li]
    const out = new Array<number>(layer.b.length)
    for (let o = 0; o < layer.b.length; o++) {
      let z = layer.b[o]
      const row = layer.W[o]
      for (let i = 0; i < a.length; i++) z += row[i] * a[i]
      out[o] = li < L - 1 ? Math.tanh(z) : z
    }
    a = out
  }
  return a[0]
}

export function mse(model: MLPRegressor, points: RegressionPoint[]): number {
  if (points.length === 0) return 0
  let s = 0
  for (const p of points) {
    const d = predict(model, p.x) - p.y
    s += d * d
  }
  return s / points.length
}

// Adam optimizer state, shaped like the model.
export type AdamMoment = { mW: number[][]; vW: number[][]; mb: number[]; vb: number[] }
export type Trainer = { model: MLPRegressor; moments: AdamMoment[]; t: number }

export function initTrainer(model: MLPRegressor): Trainer {
  const moments: AdamMoment[] = model.layers.map((layer) => ({
    mW: layer.W.map((row) => row.map(() => 0)),
    vW: layer.W.map((row) => row.map(() => 0)),
    mb: layer.b.map(() => 0),
    vb: layer.b.map(() => 0),
  }))
  return { model, moments, t: 0 }
}

const BETA1 = 0.9
const BETA2 = 0.999
const EPS = 1e-8

// One full-batch step: real backpropagation of the MSE gradient, then Adam.
// Mutates the trainer in place for performance (teaching-scale models).
export function trainStep(trainer: Trainer, points: RegressionPoint[], lr = 0.02): void {
  const { model } = trainer
  const L = model.layers.length
  const n = points.length
  if (n === 0) return

  // gradient accumulators
  const gW = model.layers.map((layer) => layer.W.map((row) => row.map(() => 0)))
  const gb = model.layers.map((layer) => layer.b.map(() => 0))

  for (const p of points) {
    // forward, caching activations
    const acts: number[][] = [[p.x]]
    for (let li = 0; li < L; li++) {
      const layer = model.layers[li]
      const prev = acts[li]
      const out = new Array<number>(layer.b.length)
      for (let o = 0; o < layer.b.length; o++) {
        let z = layer.b[o]
        const row = layer.W[o]
        for (let i = 0; i < prev.length; i++) z += row[i] * prev[i]
        out[o] = li < L - 1 ? Math.tanh(z) : z
      }
      acts.push(out)
    }

    const yHat = acts[L][0]
    // gradient of mean(0.5*(yHat-y)^2) w.r.t output pre-activation (linear)
    let delta = [yHat - p.y]

    for (let li = L - 1; li >= 0; li--) {
      const layer = model.layers[li]
      const prev = acts[li]
      for (let o = 0; o < layer.b.length; o++) {
        gb[li][o] += delta[o]
        const grow = gW[li][o]
        for (let i = 0; i < prev.length; i++) grow[i] += delta[o] * prev[i]
      }
      if (li > 0) {
        // propagate to previous activations, then through tanh'
        const prevDelta = new Array<number>(prev.length).fill(0)
        for (let i = 0; i < prev.length; i++) {
          let s = 0
          for (let o = 0; o < layer.b.length; o++) s += layer.W[o][i] * delta[o]
          // prev = tanh(pre), so tanh'(pre) = 1 - prev^2
          prevDelta[i] = s * (1 - prev[i] * prev[i])
        }
        delta = prevDelta
      }
    }
  }

  // Adam update
  trainer.t += 1
  const t = trainer.t
  const bc1 = 1 - Math.pow(BETA1, t)
  const bc2 = 1 - Math.pow(BETA2, t)
  for (let li = 0; li < L; li++) {
    const layer = model.layers[li]
    const mom = trainer.moments[li]
    for (let o = 0; o < layer.b.length; o++) {
      // weights
      const row = layer.W[o]
      for (let i = 0; i < row.length; i++) {
        const g = gW[li][o][i] / n
        mom.mW[o][i] = BETA1 * mom.mW[o][i] + (1 - BETA1) * g
        mom.vW[o][i] = BETA2 * mom.vW[o][i] + (1 - BETA2) * g * g
        const mHat = mom.mW[o][i] / bc1
        const vHat = mom.vW[o][i] / bc2
        row[i] -= (lr * mHat) / (Math.sqrt(vHat) + EPS)
      }
      // bias
      const gbias = gb[li][o] / n
      mom.mb[o] = BETA1 * mom.mb[o] + (1 - BETA1) * gbias
      mom.vb[o] = BETA2 * mom.vb[o] + (1 - BETA2) * gbias * gbias
      const mHatB = mom.mb[o] / bc1
      const vHatB = mom.vb[o] / bc2
      layer.b[o] -= (lr * mHatB) / (Math.sqrt(vHatB) + EPS)
    }
  }
}

// Fixed, seeded data. Training points carry a little noise; test points are
// clean samples of the true target so test loss measures generalization.
export function makeRegressionData(seed = 11): { train: RegressionPoint[]; test: RegressionPoint[] } {
  const rng = makeRng(seed)
  const gauss = () => {
    const u1 = Math.max(rng(), 1e-9)
    const u2 = rng()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
  const train: RegressionPoint[] = []
  const test: RegressionPoint[] = []
  const nTrain = 40
  const nTest = 40
  for (let i = 0; i < nTrain; i++) {
    const x = X_MIN + (rng() * (X_MAX - X_MIN))
    train.push({ x, y: targetFn(x) + gauss() * 0.06 })
  }
  for (let i = 0; i < nTest; i++) {
    const x = X_MIN + ((i + 0.5) / nTest) * (X_MAX - X_MIN)
    test.push({ x, y: targetFn(x) })
  }
  train.sort((a, b) => a.x - b.x)
  return { train, test }
}
