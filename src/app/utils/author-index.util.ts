import { HOOPER_FAMILY } from '../constants/constants';
import { Recipe } from '../models/recipe.interface';

export interface AuthorEntry {
  author: string;
  count: number;
  /** Grandma's recipes, even those under her descendants' names. */
  family: boolean;
}

/**
 * True when the recipe's author names this person anywhere, as whole words, so
 * "Anne Brock" picks up "Mrs. Coats - Anne Brock" but not "Anne Brockman".
 */
export function matchesAuthor(recipeAuthor: string, author: string): boolean {
  const name = author.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return name !== '' && new RegExp(`(?<!\\w)${name}(?!\\w)`, 'i').test(recipeAuthor);
}

/** Every author with how many recipes name them, most first, then by name. */
export function indexAuthors(recipes: Recipe[]): AuthorEntry[] {
  const authors = new Set(recipes.map((recipe) => recipe.author.trim()).filter((it) => it !== ''));

  return Array.from(authors, (author) => ({
    author,
    count: recipes.filter((recipe) => matchesAuthor(recipe.author, author)).length,
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
