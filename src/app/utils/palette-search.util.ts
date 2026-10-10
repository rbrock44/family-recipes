import { getCategory } from '../models/category.enum';
import { Recipe } from '../models/recipe.interface';

export type PalettePage = 'home' | 'lists';

export interface PaletteEntry {
  key: string;
  title: string;
  detail: string;
  icon: string;
  /** Text a query can match beyond the title, e.g. author and recipe number. */
  keywords: string;
  recipe?: Recipe;
  page?: PalettePage;
}

export function toRecipeEntry(recipe: Recipe): PaletteEntry {
  const category = getCategory(recipe.category) ?? '';
  const detail = [recipe.author, `#${recipe.filename}`, category].filter(Boolean).join(' · ');

  return {
    key: `recipe-${recipe.filename}`,
    title: recipe.name,
    detail,
    icon: 'restaurant_menu',
    keywords: `${recipe.author} ${recipe.filename} ${category}`,
    recipe,
  };
}

/**
 * Every word must appear in the title or keywords, like the home search. Titles starting with
 * the query come first, then titles with a word starting with the first term, then titles
 * containing the query; ties keep the order they came in.
 */
export function searchEntries(entries: PaletteEntry[], query: string): PaletteEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return entries;
  }

  const terms = normalized.split(/\s+/);
  const rank = (entry: PaletteEntry): number => {
    const title = entry.title.toLowerCase();
    if (title.startsWith(normalized)) return 0;
    if (title.split(/\s+/).some(word => word.startsWith(terms[0]))) return 1;
    if (title.includes(normalized)) return 2;
    return 3;
  };

  return entries
    .filter(entry => {
      const haystack = `${entry.title} ${entry.keywords}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    })
    .map(entry => ({ entry, rank: rank(entry) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ entry }) => entry);
}
