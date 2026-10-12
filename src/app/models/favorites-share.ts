import { decodeSharePayload, encodeSharePayload } from './list-share';

export interface SharedFavoritesPayload {
  name: string;
  favorites: string[];
}

export function encodeSharedFavorites(payload: SharedFavoritesPayload): string {
  return encodeSharePayload(payload);
}

// Links travel through chat apps and can be hand-edited, so only well-formed
// filenames make it through.
export function decodeSharedFavorites(encoded: string): SharedFavoritesPayload {
  const raw = decodeSharePayload<Partial<SharedFavoritesPayload>>(encoded);

  if (!raw || !Array.isArray(raw.favorites)) {
    throw new Error('Shared favorites link is malformed');
  }

  const favorites = raw.favorites.filter(
    (it): it is string => typeof it === 'string' && /^\d{4}$/.test(it),
  );

  return {
    name: typeof raw.name === 'string' ? raw.name.trim() : '',
    favorites: Array.from(new Set(favorites)),
  };
}

/** Adds shared favorites missing from `mine`, keeping existing order first. */
export function mergeFavorites(mine: string[], shared: string[]): string[] {
  const existing = new Set(mine);
  return [...mine, ...shared.filter((it) => !existing.has(it))];
}
