import type { Note, NoteInput } from '@shared'

const BASE = '/api'
const PAGE = 60 // matches the api's default page size

export async function fetchNotes(before?: string): Promise<Note[]> {
  const url = new URL(`${BASE}/notes`, window.location.origin)
  if (before) url.searchParams.set('before', before)
  const res = await fetch(url)
  if (!res.ok) throw new Error('could not load notes')
  const data = (await res.json()) as { notes: Note[] }
  return data.notes
}

// the wall shows every note, so page all the way through. returns them oldest
// first, which is the order the board piles them up in.
export async function fetchAllNotes(): Promise<Note[]> {
  const all: Note[] = []
  let before: string | undefined
  for (;;) {
    const page = await fetchNotes(before)
    all.push(...page)
    if (page.length < PAGE) break
    before = page[page.length - 1].createdAt
  }
  return all.reverse()
}

// whether this visitor has already signed, so the page can hide the pad.
export async function fetchHasPosted(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/me`)
    if (!res.ok) return false
    const data = (await res.json()) as { hasPosted?: boolean }
    return Boolean(data.hasPosted)
  } catch {
    return false
  }
}

export async function postNote(input: NoteInput): Promise<Note> {
  const res = await fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json().catch(() => ({}))) as { note?: Note; error?: string }
  if (!res.ok || !data.note) throw new Error(data.error || 'could not post note')
  return data.note
}
