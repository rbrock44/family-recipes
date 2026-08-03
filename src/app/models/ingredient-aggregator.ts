import { Ingredient } from './ingredient.interface';
import { Recipe } from './recipe.interface';

export interface RecipeBatch {
  recipe: Recipe;
  batches: number;
}

// The normalized unit+name grouping key, exposed alongside the display
// fields so callers (e.g. a grocery-list checkbox) have something stable to
// key persisted state on - display `name` stays as whichever original
// ingredient text was seen first for the group.
export interface AggregatedIngredient extends Ingredient {
  key: string;
}

// Ingredient units live baked into the leading word(s) of `name` (e.g. "cups
// flour", "T. clear syrup") rather than a separate field, so matching has to
// pull that token off first. `t`/`T` are the one genuinely ambiguous pair
// (teaspoon vs tablespoon) - real recipes rely on case there, so it's checked
// before falling back to a case-insensitive lookup for everything else.
const CASE_SENSITIVE_UNITS: Record<string, string> = {
  T: 'tbsp',
  'T.': 'tbsp',
  t: 'tsp',
  't.': 'tsp',
};

const UNIT_ALIASES: Record<string, string> = {
  c: 'cup',
  'c.': 'cup',
  cup: 'cup',
  cups: 'cup',
  tsp: 'tsp',
  'tsp.': 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  'tbsp.': 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  lb: 'lb',
  'lb.': 'lb',
  lbs: 'lb',
  'lbs.': 'lb',
  pound: 'lb',
  pounds: 'lb',
  oz: 'oz',
  'oz.': 'oz',
  ounce: 'oz',
  ounces: 'oz',
  pkg: 'pkg',
  'pkg.': 'pkg',
  package: 'pkg',
  packages: 'pkg',
  can: 'can',
  cans: 'can',
  stick: 'stick',
  sticks: 'stick',
  qt: 'qt',
  'qt.': 'qt',
  quart: 'qt',
  quarts: 'qt',
  gal: 'gal',
  'gal.': 'gal',
  gallon: 'gal',
  gallons: 'gal',
  pt: 'pt',
  'pt.': 'pt',
  pint: 'pt',
  pints: 'pt',
  box: 'box',
  boxes: 'box',
  jar: 'jar',
  jars: 'jar',
  bottle: 'bottle',
  bottles: 'bottle',
};

// Best-effort merge: sums amounts only when the normalized unit AND core name
// both line up. Anything that doesn't confidently match stays as its own
// line rather than risking an incorrect total - see the "grill me" feature
// discussion for why exact merging isn't attempted.
export function aggregateIngredients(
  entries: RecipeBatch[],
): AggregatedIngredient[] {
  const groups = new Map<string, AggregatedIngredient>();

  entries.forEach(({ recipe, batches }) => {
    recipe.ingredients.forEach((ingredient) => {
      const key = buildKey(ingredient.name);
      const scaledAmount = ingredient.amount * batches;
      const existing = groups.get(key);

      if (existing) {
        existing.amount += scaledAmount;
      } else {
        groups.set(key, { key, amount: scaledAmount, name: ingredient.name });
      }
    });
  });

  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function buildKey(name: string): string {
  const trimmed = name.trim();
  const match = trimmed.match(/^(\S+)\s+(.*)$/);

  let unit = '';
  let rest = trimmed;

  if (match) {
    const [, leadingToken, remainder] = match;
    const resolvedUnit =
      CASE_SENSITIVE_UNITS[leadingToken] ??
      UNIT_ALIASES[leadingToken.toLowerCase()];

    if (resolvedUnit) {
      unit = resolvedUnit;
      rest = remainder;
    }
  }

  return `${unit}|${normalizeCore(rest)}`;
}

function normalizeCore(value: string): string {
  return value
    .split(',')[0]
    .replace(/\([^)]*\)/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/s$/, '');
}
