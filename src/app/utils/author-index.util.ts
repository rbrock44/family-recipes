import { AUTHOR_ALIASES, AUTHOR_SOURCES, HOOPER_FAMILY } from '../constants/constants';
import { Recipe } from '../models/recipe.interface';

export interface AuthorEntry {
  author: string;
  count: number;
  /** Grandma's recipes, even those under her descendants' names. */
  family: boolean;
}

/** Matches one person however they were written: case and a trailing dot don't matter. */
export function authorKey(person: string): string {
  return person.trim().toLowerCase().replace(/\.$/, '');
}

const ALIAS_KEYS = new Map(Object.entries(AUTHOR_ALIASES).map(([alias, name]) => [authorKey(alias), name]));
const FAMILY_KEYS = new Set(HOOPER_FAMILY.map((name) => authorKey(canonical(name))));
const SOURCE_KEYS = new Set(AUTHOR_SOURCES.map(authorKey));
const WEBSITE = /\.(com|net|org)\b/i;
const peopleCache = new Map<string, string[]>();

function canonical(person: string): string {
  return ALIAS_KEYS.get(authorKey(person)) ?? person;
}

/** A website, brand, magazine or restaurant rather than a person. */
function isSource(name: string): boolean {
  return WEBSITE.test(name) || SOURCE_KEYS.has(authorKey(name));
}

/**
 * The people a recipe credits, one name each: "Mrs. Coats - Anne Brock" is Mrs. Coats and
 * Anne Brock, "Helen Menz and Donna Menz" is both Menzes, and "In Memory of" is dropped.
 * Websites and brands only count when nobody else is named.
 */
export function authorPeople(credit: string): string[] {
  const cached = peopleCache.get(credit);
  if (cached) {
    return cached;
  }

  const extras: string[] = [];
  const text = credit
    // "(Rebecca Hooper)" names someone else; "(Pat)" or "(Schlosser)" just adds to the name.
    .replace(/\(([^)]*)\)/g, (_, inner: string) => {
      const name = inner.replace(/^submitted by:\s*/i, '').trim();
      if (name.includes(' ')) {
        extras.push(name);
      }
      return ' ';
    })
    .replace(/,\s*(jr|sr)\.?/gi, ' $1.');

  const parts = [...text.split(/,| - | from /i), ...extras]
    // "Lois and Lynna Drury" is one family name; "Helen Menz and Donna Menz" is two people.
    .flatMap((part) => {
      const [first, ...rest] = part.split(/ and /i);
      return rest.length > 0 && first.trim().includes(' ') ? [first, ...rest] : [part];
    })
    .map((part) => part.replace(/^\s*in memory of\s+/i, '').replace(/\s+/g, ' ').trim())
    // "Grandmother of Joan Drury" describes the person before it; "IL" ends "Chicago, IL";
    // "January 2014" dates the magazine before it.
    .filter(
      (part) =>
        part !== '' && !/^grandmother of /i.test(part) && !/^[A-Z]{2}$/.test(part) && !/^([a-z]+ )?\d{4}$/i.test(part),
    );

  const people = parts.some((part) => !isSource(part)) ? parts.filter((part) => !isSource(part)) : parts;

  const seen = new Set<string>();
  const result = people.map(canonical).filter((person) => {
    const key = authorKey(person);
    return !seen.has(key) && !!seen.add(key);
  });

  peopleCache.set(credit, result);
  return result;
}

/** True when the recipe credits this person, under any spelling. */
export function matchesAuthor(credit: string, person: string): boolean {
  const key = authorKey(canonical(person));
  return authorPeople(credit).some((it) => authorKey(it) === key);
}

/** Every person credited with how many recipes name them, most first, then by name. */
export function indexAuthors(recipes: Recipe[]): AuthorEntry[] {
  const counts = new Map<string, number>();
  // Each spelling's uses, so the chip shows the one written most.
  const spellings = new Map<string, Map<string, number>>();

  recipes.forEach((recipe) => {
    // A credit naming only a brand or website still searches from its byline, but gets no chip.
    authorPeople(recipe.author).filter((person) => !isSource(person)).forEach((person) => {
      const key = authorKey(person);
      counts.set(key, (counts.get(key) ?? 0) + 1);

      const uses = spellings.get(key) ?? new Map<string, number>();
      uses.set(person, (uses.get(person) ?? 0) + 1);
      spellings.set(key, uses);
    });
  });

  return Array.from(counts, ([key, count]) => {
    const uses = Array.from(spellings.get(key)!);
    const author = uses.sort((a, b) => b[1] - a[1])[0][0];
    return { author, count, family: FAMILY_KEYS.has(key) };
  }).sort((a, b) => b.count - a.count || a.author.localeCompare(b.author));
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
