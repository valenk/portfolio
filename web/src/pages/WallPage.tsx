import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Note } from '@shared'
import { fetchAllNotes } from '../lib/notesApi'
import { boardHeight, scatter } from '../lib/wallLayout'
import { DrawPad } from '../components/DrawPad'
import { NoteCard } from '../components/NoteCard'

export function WallPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const boardRef = useRef<HTMLDivElement>(null)
  const [boardWidth, setBoardWidth] = useState(0)

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

  const positions = useMemo(
    () => scatter(notes.map((n) => n.id), boardWidth),
    [notes, boardWidth],
  )
  const height = useMemo(() => boardHeight(positions), [positions])

  return (
    <section className="wall">
      <header className="wall-head">
        <h1 className="wall-title">sign the wall</h1>
        <p className="wall-lede muted">
          draw or scribble a little something and stick it up. one per visitor,
          and it stays here for good.
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
          const style: CSSProperties | undefined = p
            ? { left: `${p.x}px`, top: `${p.y}px` }
            : undefined
          return <NoteCard key={n.id} note={n} style={style} />
        })}
      </div>
    </section>
  )
}
