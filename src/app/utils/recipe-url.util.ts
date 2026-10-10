/** Lowercase, hyphenated, ascii-only form of a recipe name for its URL. */
export function recipeSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `/<id>/<slug>`, or just `/<id>` when the name isn't known yet. */
export function recipePath(filename: string, name?: string): string {
  const slug = name ? recipeSlug(name) : '';
  return slug ? `/${filename}/${slug}` : `/${filename}`;
}

/** True for a URL segment that can be a recipe id (`0001`, or unpadded `1`). */
export function isRecipeId(segment: string | undefined): boolean {
  return !!segment && /^\d{1,4}$/.test(segment);
}

/** The recipe filename a path points at, or null. Only the id counts; the name is cosmetic. */
export function parseRecipeId(path: string): string | null {
  const first = path.split(/[?#]/)[0].split('/').filter(Boolean)[0];
  return isRecipeId(first) ? first.padStart(4, '0') : null;
}

/** True when a path is the lists page. */
export function isListsPath(path: string): boolean {
  return path.split(/[?#]/)[0].replace(/\/+$/, '') === '/lists';
}
