// where each post-it sits on the board. positions are seeded off the note id
// so a card lands in the same place every render (until the board resizes),
// instead of jumping around. the columns and rows are tighter than a card so
// notes overlap a bit, like a real pile, and the board just keeps growing down.

export const CARD_W = 190
export const CARD_H = 200

const COL_W = 132 // < CARD_W, so neighbours overlap sideways
const ROW_H = 132 // < CARD_H, so rows overlap top to bottom
const PAD = 8

export type Pos = { x: number; y: number }

// tiny deterministic rng seeded from a string
function seeded(id: string): () => number {
  let s = 2166136261
  for (let i = 0; i < id.length; i++) {
    s ^= id.charCodeAt(i)
    s = Math.imul(s, 16777619)
  }
  s >>>= 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

export function scatter(ids: string[], boardWidth: number): Record<string, Pos> {
  const usable = Math.max(0, boardWidth - CARD_W)
  const cols = Math.max(1, Math.floor(usable / COL_W) + 1)
  const out: Record<string, Pos> = {}

  ids.forEach((id, i) => {
    const rnd = seeded(id)
    const col = i % cols
    const row = Math.floor(i / cols)
    const jx = (rnd() - 0.5) * COL_W * 0.9
    const jy = (rnd() - 0.5) * ROW_H * 0.5
    const x = Math.min(usable, Math.max(0, col * COL_W + jx))
    const y = Math.max(PAD, PAD + row * ROW_H + jy)
    out[id] = { x, y }
  })

  return out
}

export function boardHeight(positions: Record<string, Pos>): number {
  let max = 0
  for (const id in positions) max = Math.max(max, positions[id].y + CARD_H)
  return max + PAD
}
