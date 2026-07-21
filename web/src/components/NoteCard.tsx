import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as RPointerEvent,
} from 'react'
import { CANVAS, type Note } from '@shared'
import { cn } from '../lib/cn'
import { paint } from '../lib/draw'

type Props = {
  note: Note
  style?: CSSProperties
  dragging?: boolean
  onPointerDown?: (e: RPointerEvent<HTMLElement>) => void
  onPointerMove?: (e: RPointerEvent<HTMLElement>) => void
  onPointerUp?: (e: RPointerEvent<HTMLElement>) => void
}

export function NoteCard({ note, style, dragging, onPointerDown, onPointerMove, onPointerUp }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = CANVAS.width * dpr
    canvas.height = CANVAS.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paint(ctx, note.color, note.strokes)
  }, [note])

  // board position comes in via style, tilt is the card's own stable angle
  const merged = { '--tilt': `${tiltFor(note.id)}deg`, ...style } as CSSProperties

  return (
    <figure
      className={cn('wall-card', dragging && 'wall-card--dragging')}
      style={merged}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas
        ref={canvasRef}
        className="wall-canvas"
        style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}` }}
        aria-label={note.author ? `note by ${note.author}` : 'a note'}
      />
      <figcaption className="wall-card-meta">
        <span className="wall-card-author">{note.author || 'anonymous'}</span>
        <span className="wall-card-date">{formatDate(note.createdAt)}</span>
      </figcaption>
    </figure>
  )
}

// small, stable tilt derived from the id so a card keeps the same angle across
// re-renders instead of jittering.
function tiltFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return (Math.abs(h) % 100) / 100 * 6 - 3
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
