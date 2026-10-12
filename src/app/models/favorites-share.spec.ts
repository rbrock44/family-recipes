import {
  decodeSharedFavorites,
  encodeSharedFavorites,
  mergeFavorites,
} from './favorites-share';
import { encodeSharePayload } from './list-share';

describe('favorites share encoding', () => {
  it('round trips favorites with a name', () => {
    const payload = { name: 'Grandma', favorites: ['0001', '0102'] };

    expect(decodeSharedFavorites(encodeSharedFavorites(payload))).toEqual(payload);
  });

  it('drops malformed and duplicate filenames', () => {
    const encoded = encodeSharePayload({
      name: '  Ryan  ',
      favorites: ['0001', '0001', '../etc', 7, '12', '0002'],
    });

    expect(decodeSharedFavorites(encoded)).toEqual({
      name: 'Ryan',
      favorites: ['0001', '0002'],
    });
  });

  it('defaults a missing name to blank', () => {
    const encoded = encodeSharePayload({ favorites: ['0001'] });

    expect(decodeSharedFavorites(encoded).name).toBe('');
  });

  it('throws when favorites are missing', () => {
    expect(() => decodeSharedFavorites(encodeSharePayload({ name: 'x' }))).toThrow();
    expect(() => decodeSharedFavorites('not-base64!!')).toThrow();
  });
});

describe('mergeFavorites', () => {
  it('appends only new favorites, keeping mine first', () => {
    expect(mergeFavorites(['0003', '0001'], ['0001', '0002'])).toEqual([
      '0003',
      '0001',
      '0002',
    ]);
  });

  it('returns mine unchanged when nothing is new', () => {
    expect(mergeFavorites(['0001'], ['0001'])).toEqual(['0001']);
  });
});
