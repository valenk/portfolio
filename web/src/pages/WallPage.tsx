import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as RPointerEvent } from 'react'
import type { Note } from '@shared'
import { fetchAllNotes } from '../lib/notesApi'
import { boardHeight, scatter, CARD_W, type Pos } from '../lib/wallLayout'
import { DrawPad } from '../components/DrawPad'
import { NoteCard } from '../components/NoteCard'

export function WallPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const boardRef = useRef<HTMLDivElement>(null)
  const [boardWidth, setBoardWidth] = useState(0)

  // notes the visitor has dragged, which card is lifted on top, and which one
  // is being held right now (drives the grabbing look)
  const [moved, setMoved] = useState<Record<string, Pos>>({})
  const [frontId, setFrontId] = useState<string | null>(null)
  const [heldId, setHeldId] = useState<string | null>(null)
  const drag = useRef<{ id: string; px: number; py: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    let alive = true
    fetchAllNotes()
      .then((list) => {
        if (!alive) return
        setNotes(list)
        setStatus('ready')
      })
      .catch(() => {
        if (alive) setStatus('error')
      })
    return () => {
      alive = false
    }
  }, [])

  // track the board width so the scatter can spread across it and reflow on resize
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const measure = () => setBoardWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const base = useMemo(() => scatter(notes.map((n) => n.id), boardWidth), [notes, boardWidth])
  // a dragged card wins over its seeded spot
  const positions = useMemo(() => ({ ...base, ...moved }), [base, moved])
  const height = useMemo(() => boardHeight(positions), [positions])

  function onDown(id: string, e: RPointerEvent<HTMLElement>) {
    const cur = positions[id] ?? { x: 0, y: 0 }
    drag.current = { id, px: e.clientX, py: e.clientY, ox: cur.x, oy: cur.y }
    setFrontId(id)
    setHeldId(id)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onMove(e: RPointerEvent<HTMLElement>) {
    const d = drag.current
    if (!d) return
    const maxX = Math.max(0, boardWidth - CARD_W)
    const x = Math.min(maxX, Math.max(0, d.ox + (e.clientX - d.px)))
    const y = Math.max(0, d.oy + (e.clientY - d.py))
    setMoved((prev) => ({ ...prev, [d.id]: { x, y } }))
  }

  function onUp() {
    drag.current = null
    setHeldId(null)
  }

  return (
    <section className="wall">
      <header className="wall-head">
        <h1 className="wall-title">sign the wall</h1>
        <p className="wall-lede muted">
          draw or scribble a little something and stick it up. one per visitor,
          and it stays here for good. drag the notes around if you like.
        </p>
      </header>

      <DrawPad onPosted={(note) => setNotes((prev) => [...prev, note])} />

      {status === 'loading' && <p className="muted wall-note">loading the wall...</p>}
      {status === 'error' && <p className="muted wall-note">the wall is napping, try again later.</p>}
      {status === 'ready' && notes.length === 0 && (
        <p className="muted wall-note">no notes yet. be the first to sign.</p>
      )}

      <div
        ref={boardRef}
        className="wall-board"
        style={{ height: notes.length ? height : undefined }}
      >
        {notes.map((n) => {
          const p = positions[n.id]
          const style: CSSProperties = {
            left: `${p?.x ?? 0}px`,
            top: `${p?.y ?? 0}px`,
            zIndex: frontId === n.id ? 1000 : undefined,
          }
          return (
            <NoteCard
              key={n.id}
              note={n}
              style={style}
              dragging={heldId === n.id}
              onPointerDown={(e) => onDown(n.id, e)}
              onPointerMove={onMove}
              onPointerUp={onUp}
            />
          )
        })}
      </div>
    </section>
  )
}
