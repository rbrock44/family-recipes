import { encodeSharePayload } from './list-share';
import {
  appendSharedNote,
  decodeSharedNote,
  encodeSharedNote,
  MAX_NOTE_LENGTH,
} from './note-share';

describe('note share encoding', () => {
  it('round trips a note with a name', () => {
    const payload = { name: 'Grandma', filename: '0042', note: 'Doubled the butter — trust me.' };

    expect(decodeSharedNote(encodeSharedNote(payload))).toEqual(payload);
  });

  it('trims the name and note, and caps the note length', () => {
    const encoded = encodeSharePayload({ name: '  Ryan ', filename: '0001', note: `  ${'a'.repeat(3000)}  ` });

    const decoded = decodeSharedNote(encoded);
    expect(decoded.name).toBe('Ryan');
    expect(decoded.note.length).toBe(MAX_NOTE_LENGTH);
  });

  it('defaults a missing name to blank', () => {
    expect(decodeSharedNote(encodeSharePayload({ filename: '0001', note: 'x' })).name).toBe('');
  });

  it('rejects a bad recipe id or an empty note', () => {
    expect(() => decodeSharedNote(encodeSharePayload({ filename: '../etc', note: 'x' }))).toThrow();
    expect(() => decodeSharedNote(encodeSharePayload({ filename: '0001', note: '   ' }))).toThrow();
    expect(() => decodeSharedNote(encodeSharePayload({ filename: '0001' }))).toThrow();
    expect(() => decodeSharedNote('not base64!')).toThrow();
  });
});

describe('appendSharedNote', () => {
  const shared = { name: 'Grandma', filename: '0001', note: 'Use less salt.' };

  it('becomes the whole note when I have none', () => {
    expect(appendSharedNote('  ', shared)).toBe('From Grandma: Use less salt.');
  });

  it('goes under my own note', () => {
    expect(appendSharedNote('Bake 5 min longer.', shared)).toBe(
      'Bake 5 min longer.\n\nFrom Grandma: Use less salt.',
    );
  });

  it('skips the credit without a name', () => {
    expect(appendSharedNote('', { ...shared, name: '' })).toBe('Use less salt.');
  });

  it('does not add the same note twice', () => {
    const once = appendSharedNote('', shared);

    expect(appendSharedNote(once, shared)).toBe(once);
  });
});
