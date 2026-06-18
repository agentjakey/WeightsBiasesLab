// A real single artificial neuron (logistic classifier) over two inputs.
//
//   z          = w1 * x1 + w2 * x2 + b
//   yHat       = sigmoid(z)
//   prediction = yHat >= 0.5 ? 1 : 0      (equivalently z >= 0)
//
// neuronForward is the single source of truth. The probability field, the
// sample-point predictions, the hover readout, the accuracy meter, the
// gradient-descent demo, and the displayed equation all flow through it. A
// larger neural network is just many units like this, stacked.

export type Weights = {
  w1: number
  w2: number
  b: number
}

export type SamplePoint = {
  x1: number
  x2: number
  label: 0 | 1
}

export type Forward = {
  z: number
  yHat: number
  prediction: 0 | 1
}

export const DOMAIN = 4 // plot spans x1, x2 in [-DOMAIN, DOMAIN]
export const WEIGHT_RANGE = 5 // sliders span [-WEIGHT_RANGE, WEIGHT_RANGE]
export const DEGENERATE_EPS = 0.05 // |w1| and |w2| below this => no real boundary

export const DEFAULT_WEIGHTS: Weights = { w1: 1.4, w2: -1.0, b: 0.5 }

// Two-class colors, taken from the FailModeAtlas palette (accent + objective
// family blue) so the visualization stays inside the shared design system.
export const CLASS_COLORS: Record<0 | 1, string> = {
  1: '#C2411C', // accent
  0: '#4E8098', // family: objective
}
export const BOUNDARY_COLOR = '#1A1915' // primary

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z))
}

export function neuronForward(x1: number, x2: number, w: Weights): Forward {
  const z = w.w1 * x1 + w.w2 * x2 + w.b
  const yHat = sigmoid(z)
  return { z, yHat, prediction: yHat >= 0.5 ? 1 : 0 }
}

// A small, fixed dataset that is roughly separable along the x1 + x2 diagonal.
// Class 1 sits in the upper-right, class 0 in the lower-left.
export const SAMPLES: SamplePoint[] = [
  { x1: 1.5, x2: 1.5, label: 1 },
  { x1: 2.5, x2: 0.5, label: 1 },
  { x1: 0.8, x2: 2.6, label: 1 },
  { x1: 2.2, x2: 1.8, label: 1 },
  { x1: 1.0, x2: 1.2, label: 1 },
  { x1: -1.5, x2: -1.5, label: 0 },
  { x1: -2.5, x2: -0.5, label: 0 },
  { x1: -0.8, x2: -2.6, label: 0 },
  { x1: -2.2, x2: -1.8, label: 0 },
  { x1: -1.0, x2: -1.2, label: 0 },
]

export function countCorrect(w: Weights): number {
  return SAMPLES.reduce(
    (acc, p) => acc + (neuronForward(p.x1, p.x2, w).prediction === p.label ? 1 : 0),
    0
  )
}

// The neuron has no meaningful decision boundary when both weights vanish:
// z is then the constant b for every input.
export function isDegenerate(w: Weights): boolean {
  return Math.abs(w.w1) < DEGENERATE_EPS && Math.abs(w.w2) < DEGENERATE_EPS
}

// Endpoints of the decision boundary (z = 0) clipped to the square viewport
// [-DOMAIN, DOMAIN]^2. Handles the vertical case (w2 ~ 0) and returns null when
// the line does not cross the visible box (degenerate weights).
export function boundaryEndpoints(
  w: Weights,
  d = DOMAIN
): [{ x1: number; x2: number }, { x1: number; x2: number }] | null {
  const { w1, w2, b } = w
  const eps = 1e-9
  const pts: { x1: number; x2: number }[] = []

  if (Math.abs(w2) > eps) {
    // intersection with left/right edges (x1 = -d and x1 = d)
    for (const x1 of [-d, d]) {
      const x2 = -(w1 * x1 + b) / w2
      if (x2 >= -d - eps && x2 <= d + eps) pts.push({ x1, x2 })
    }
  }
  if (Math.abs(w1) > eps) {
    // intersection with top/bottom edges (x2 = -d and x2 = d)
    for (const x2 of [-d, d]) {
      const x1 = -(w2 * x2 + b) / w1
      if (x1 >= -d - eps && x1 <= d + eps) pts.push({ x1, x2 })
    }
  }

  if (pts.length < 2) return null

  // Deduplicate near-identical corner intersections, then take the two points
  // that are farthest apart so we draw the full visible chord.
  const unique: { x1: number; x2: number }[] = []
  for (const p of pts) {
    if (!unique.some((q) => Math.abs(q.x1 - p.x1) < 1e-6 && Math.abs(q.x2 - p.x2) < 1e-6)) {
      unique.push(p)
    }
  }
  if (unique.length < 2) return null

  let best: [(typeof unique)[0], (typeof unique)[0]] = [unique[0], unique[1]]
  let bestDist = -1
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const dx = unique[i].x1 - unique[j].x1
      const dy = unique[i].x2 - unique[j].x2
      const dist = dx * dx + dy * dy
      if (dist > bestDist) {
        bestDist = dist
        best = [unique[i], unique[j]]
      }
    }
  }
  return best
}

function clampWeight(v: number): number {
  return Math.max(-WEIGHT_RANGE, Math.min(WEIGHT_RANGE, v))
}

// One step of batch gradient descent on the binary cross-entropy loss for the
// fixed samples. The gradient of the loss w.r.t. z is (yHat - label), which is
// why this reuses neuronForward directly. Weights are clamped to the slider
// range so the controls stay in sync.
export function trainStep(w: Weights, lr = 0.4): Weights {
  let g1 = 0
  let g2 = 0
  let gb = 0
  for (const p of SAMPLES) {
    const { yHat } = neuronForward(p.x1, p.x2, w)
    const d = yHat - p.label
    g1 += d * p.x1
    g2 += d * p.x2
    gb += d
  }
  const n = SAMPLES.length
  return {
    w1: clampWeight(w.w1 - (lr * g1) / n),
    w2: clampWeight(w.w2 - (lr * g2) / n),
    b: clampWeight(w.b - (lr * gb) / n),
  }
}

export type Preset = {
  id: string
  label: string
  weights: Weights
}

export const PRESETS: Preset[] = [
  { id: 'reset', label: 'Reset', weights: { w1: 1.4, w2: -1.0, b: 0.5 } },
  { id: 'rotate', label: 'Rotate boundary', weights: { w1: -1.8, w2: 1.8, b: 0.5 } },
  { id: 'shift', label: 'Shift boundary', weights: { w1: 1.4, w2: -1.0, b: -3.2 } },
  { id: 'good', label: 'Good fit', weights: { w1: 2.2, w2: 2.0, b: 0.2 } },
  { id: 'bad', label: 'Bad fit', weights: { w1: -2.4, w2: -1.6, b: 0.4 } },
]
