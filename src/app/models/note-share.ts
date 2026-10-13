import { decodeSharePayload, encodeSharePayload } from './list-share';

export interface SharedNotePayload {
  name: string;
  filename: string;
  note: string;
}

/** Keeps share links a sensible length for chat apps. */
export const MAX_NOTE_LENGTH = 2000;

export function encodeSharedNote(payload: SharedNotePayload): string {
  return encodeSharePayload(payload);
}

// Links travel through chat apps and can be hand-edited, so only a real recipe id and some
// actual note text make it through.
export function decodeSharedNote(encoded: string): SharedNotePayload {
  const raw = decodeSharePayload<Partial<SharedNotePayload>>(encoded);

  if (!raw || typeof raw.filename !== 'string' || !/^\d{4}$/.test(raw.filename)) {
    throw new Error('Shared note link is malformed');
  }

  const note = typeof raw.note === 'string' ? raw.note.trim().slice(0, MAX_NOTE_LENGTH) : '';
  if (!note) {
    throw new Error('Shared note link has no note');
  }

  return {
    name: typeof raw.name === 'string' ? raw.name.trim() : '',
    filename: raw.filename,
    note,
  };
}

/** Adds a shared note under mine, credited to whoever sent it; skips one I already have. */
export function appendSharedNote(mine: string, shared: SharedNotePayload): string {
  const own = mine.trim();
  if (own.includes(shared.note)) {
    return own;
  }

  const credited = shared.name ? `From ${shared.name}: ${shared.note}` : shared.note;
  return own ? `${own}\n\n${credited}` : credited;
}
