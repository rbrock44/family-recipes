// Also loaded by scripts/checkRecipes.js (via Node's type stripping), so this file must
// stay free of imports and of TypeScript-only syntax such as enums.

export interface CheckableIngredient {
  name: string;
  amount: number;
  unit?: string;
}

export interface CheckableRecipe {
  filename: string;
  name: string;
  author: string;
  category: number;
  instructions: string;
  ingredients: CheckableIngredient[];
  yield?: { amount: number; name: string };
}

export type IssueKind =
  | 'missing-field'
  | 'bad-category'
  | 'no-ingredients'
  | 'bad-amount'
  | 'no-yield'
  | 'unknown-unit'
  | 'duplicate'
  | 'numbering';

export interface RecipeIssue {
  kind: IssueKind;
  filename: string;
  message: string;
}

export interface PossibleTypo {
  word: string;
  suggestion: string;
  /** Recipes the rare spelling appears in. */
  filenames: string[];
}

export interface CheckReport {
  issues: RecipeIssue[];
  typos: PossibleTypo[];
}

const CATEGORY_COUNT = 9;

/** Everything worth a look in the recipe data. Nothing here blocks a build; it's a to-do list. */
export function checkRecipes(recipes: CheckableRecipe[]): CheckReport {
  return {
    issues: [
      ...checkNumbering(recipes.map((it) => it.filename)),
      ...recipes.flatMap(checkRecipe),
      ...findDuplicates(recipes),
    ],
    typos: findTypos(recipes),
  };
}

export function checkRecipe(recipe: CheckableRecipe): RecipeIssue[] {
  const issues: RecipeIssue[] = [];
  const add = (kind: IssueKind, message: string) => issues.push({ kind, filename: recipe.filename, message });

  for (const field of ['name', 'author', 'instructions'] as const) {
    if (typeof recipe[field] !== 'string' || recipe[field].trim() === '') {
      add('missing-field', `no ${field}`);
    }
  }

  if (!Number.isInteger(recipe.category) || recipe.category < 1 || recipe.category > CATEGORY_COUNT) {
    add('bad-category', `category ${JSON.stringify(recipe.category)} is not 1-${CATEGORY_COUNT}`);
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    add('no-ingredients', 'no ingredients');
  } else {
    recipe.ingredients.forEach((ingredient, index) => {
      const line = `ingredient ${index + 1} "${ingredient.name}"`;

      if (typeof ingredient.amount !== 'number' || !isFinite(ingredient.amount) || ingredient.amount < 0) {
        add('bad-amount', `${line} has amount ${JSON.stringify(ingredient.amount)}`);
      }

      const unit = looksLikeUnit(ingredient);
      if (unit) {
        add('unknown-unit', `${line} starts with "${unit}", which looks like a unit but isn't a known one`);
      }
    });
  }

  if (!recipe.yield || !(recipe.yield.amount > 0)) {
    add('no-yield', 'no yield amount');
  }

  return issues;
}

/** Files should run 0001, 0002... with no gaps, since the number is the recipe id. */
export function checkNumbering(filenames: string[]): RecipeIssue[] {
  const numbers = filenames.map((it) => Number.parseInt(it, 10)).sort((a, b) => a - b);
  const issues: RecipeIssue[] = [];

  numbers.forEach((number, index) => {
    const expected = index === 0 ? 1 : numbers[index - 1] + 1;
    if (number > expected) {
      const missing = number - 1 === expected ? pad(expected) : `${pad(expected)}-${pad(number - 1)}`;
      issues.push({ kind: 'numbering', filename: pad(number), message: `missing ${missing} before it` });
    } else if (index > 0 && number === numbers[index - 1]) {
      issues.push({ kind: 'numbering', filename: pad(number), message: 'used twice' });
    }
  });

  return issues;
}

/** The same recipe name from the same author, usually a double submission. */
export function findDuplicates(recipes: CheckableRecipe[]): RecipeIssue[] {
  const seen = new Map<string, string>();
  const issues: RecipeIssue[] = [];

  recipes.forEach((recipe) => {
    const key = `${normalize(recipe.name)}|${normalize(recipe.author)}`;
    const first = seen.get(key);

    if (first) {
      issues.push({ kind: 'duplicate', filename: recipe.filename, message: `same name and author as ${first}` });
    } else {
      seen.set(key, recipe.filename);
    }
  });

  return issues;
}

/**
 * Spellings that show up in only a recipe or two but sit a letter or so away from a word
 * many recipes use, like "margarin" next to "margarine". A dictionary would flag every
 * brand name and family term, so the collection's own common words are the reference.
 */
export function findTypos(recipes: CheckableRecipe[]): PossibleTypo[] {
  const uses = new Map<string, Set<string>>();

  recipes.forEach((recipe) => {
    const text = [recipe.name, recipe.instructions, ...(recipe.ingredients ?? []).map((it) => it.name)].join(' ');
    for (const word of words(text)) {
      let files = uses.get(word);
      if (!files) {
        files = new Set();
        uses.set(word, files);
      }
      files.add(recipe.filename);
    }
  });

  const common = Array.from(uses).filter(([, files]) => files.size >= COMMON_MIN);
  const typos: PossibleTypo[] = [];

  uses.forEach((files, word) => {
    if (files.size > RARE_MAX) {
      return;
    }

    // Short words sit a letter away from too many real words ("cola"/"cold") to call.
    if (word.length < TYPO_MIN_LENGTH) {
      return;
    }

    const limit = word.length >= 9 ? 2 : 1;
    let best: { word: string; distance: number; count: number } | null = null;

    for (const [candidate, candidateFiles] of common) {
      if (
        candidate[0] !== word[0] ||
        Math.abs(candidate.length - word.length) > limit ||
        isInflection(word, candidate)
      ) {
        continue;
      }

      const distance = editDistance(word, candidate, limit);
      if (
        distance <= limit &&
        (!best || distance < best.distance || (distance === best.distance && candidateFiles.size > best.count))
      ) {
        best = { word: candidate, distance, count: candidateFiles.size };
      }
    }

    if (best) {
      typos.push({ word, suggestion: best.word, filenames: Array.from(files).sort() });
    }
  });

  return typos.sort((a, b) => a.word.localeCompare(b.word));
}

/** A word must be in at most this many recipes to be suspect... */
const RARE_MAX = 2;
/** ...and close to one in at least this many. */
const COMMON_MIN = 15;
const TYPO_MIN_LENGTH = 6;

const SUFFIXES = ['ings', 'ing', 'ers', 'ies', 'ied', 'al', 'en', 'er', 'ed', 'es', 'ly', 's', 'd', 'r', 'y'];

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+/g) ?? []).filter((it) => it.length >= 4);
}

// Plurals and other forms of one word ("creamer"/"creamed", "bake"/"baking") are
// different words, not typos of each other. A dropped final "e" alone ("margarin")
// still counts as a typo.
function isInflection(a: string, b: string): boolean {
  const stemA = stem(a);
  const stemB = stem(b);

  if (stemA === stemB || stemA === b || a === stemB) {
    return true;
  }

  // "degree"/"degrees" stems to "degree"/"degre", "bake"/"baking" to "bake"/"bak".
  const dropE = (word: string) => word.replace(/e$/, '');
  const suffixed = stemA !== a || stemB !== b;
  return suffixed && (dropE(stemA) === stemB || stemA === dropE(stemB));
}

function stem(word: string): string {
  const suffix = SUFFIXES.find((it) => word.length - it.length >= 3 && word.endsWith(it));
  return suffix ? word.slice(0, -suffix.length) : word;
}

/** Damerau-Levenshtein (optimal string alignment), giving up once past `limit`. */
function editDistance(a: string, b: string, limit: number): number {
  let previousPrevious: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, previousPrevious[j - 2] + 1);
      }

      current.push(value);
      rowMin = Math.min(rowMin, value);
    }

    if (rowMin > limit) {
      return limit + 1;
    }

    previousPrevious = previous;
    previous = current;
  }

  return previous[b.length];
}

// Abbreviated sizes and can numbers, which lead a name without being units.
const NOT_UNITS = new Set(['lg.', 'large.', 'med.', 'medium.', 'sm.', 'small.', 'reg.', 'no.']);

/** An ingredient still carrying something unit-like ("env.", "pkt.") that the unit parser didn't know. */
function looksLikeUnit(ingredient: CheckableIngredient): string {
  if (ingredient.unit || typeof ingredient.name !== 'string') {
    return '';
  }

  const first = ingredient.name.trim().split(/\s+/)[0] ?? '';
  return /^[a-z]{1,6}\.$/i.test(first) && !NOT_UNITS.has(first.toLowerCase()) ? first : '';
}

function normalize(value: string): string {
  return (value ?? '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function pad(number: number): string {
  return String(number).padStart(4, '0');
}
