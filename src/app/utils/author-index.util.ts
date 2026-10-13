import { HOOPER_FAMILY } from '../constants/constants';
import { Recipe } from '../models/recipe.interface';

export interface AuthorEntry {
  author: string;
  count: number;
  /** Grandma's recipes, even those under her descendants' names. */
  family: boolean;
}

/** Every author with how many recipes they have, most first, then by name. */
export function indexAuthors(recipes: Recipe[]): AuthorEntry[] {
  const counts = new Map<string, number>();

  recipes.forEach((recipe) => {
    const author = recipe.author.trim();
    if (author) {
      counts.set(author, (counts.get(author) ?? 0) + 1);
    }
  });

  return Array.from(counts, ([author, count]) => ({
    author,
    count,
    family: HOOPER_FAMILY.includes(author),
  })).sort((a, b) => b.count - a.count || a.author.localeCompare(b.author));
}

/** Authors whose name contains every word typed, in any order. */
export function filterAuthors(entries: AuthorEntry[], query: string): AuthorEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter((it) => it !== '');

  if (words.length === 0) {
    return entries;
  }

  return entries.filter((entry) => {
    const name = entry.author.toLowerCase();
    return words.every((word) => name.includes(word));
  });
}
