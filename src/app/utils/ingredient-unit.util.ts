// Also loaded by the Node scripts in scripts/ (via Node's type stripping), so this file must
// stay free of imports and of TypeScript-only syntax such as enums.

export interface UnitSplit {
  /** The canonical unit, e.g. "cup" or "tsp", or "" when the name has none. */
  unit: string;
  name: string;
}

// `t`/`T` are the one genuinely ambiguous pair (teaspoon vs tablespoon) - real recipes
// rely on case there, so it's checked before falling back to a case-insensitive lookup.
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
  tbs: 'tbsp',
  'tbs.': 'tbsp',
  tbl: 'tbsp',
  'tbl.': 'tbsp',
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
  pkgs: 'pkg',
  'pkgs.': 'pkg',
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
  bag: 'bag',
  bags: 'bag',
  pinch: 'pinch',
  pinches: 'pinch',
  dash: 'dash',
  dashes: 'dash',
  sq: 'square',
  'sq.': 'square',
  square: 'square',
  squares: 'square',
};

// How each canonical unit reads next to an amount: [one, more than one].
const UNIT_LABELS: Record<string, [string, string]> = {
  cup: ['cup', 'cups'],
  tsp: ['tsp', 'tsp'],
  tbsp: ['tbsp', 'tbsp'],
  lb: ['lb', 'lbs'],
  oz: ['oz', 'oz'],
  pkg: ['pkg', 'pkg'],
  can: ['can', 'cans'],
  stick: ['stick', 'sticks'],
  qt: ['qt', 'qt'],
  gal: ['gal', 'gal'],
  pt: ['pt', 'pt'],
  box: ['box', 'boxes'],
  jar: ['jar', 'jars'],
  bottle: ['bottle', 'bottles'],
  bag: ['bag', 'bags'],
  pinch: ['pinch', 'pinches'],
  dash: ['dash', 'dashes'],
  square: ['square', 'squares'],
};

/** Resolves a written unit ("c.", "Tbsp.", "pounds") to its canonical form, or "" if it isn't one. */
export function canonicalUnit(token: string): string {
  return CASE_SENSITIVE_UNITS[token] ?? UNIT_ALIASES[token.toLowerCase()] ?? '';
}

/** Pulls a leading unit off an ingredient name: "c. butter" -> { unit: "cup", name: "butter" }. */
export function splitUnit(text: string): UnitSplit {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\S+)\s+(.*)$/);

  if (match) {
    const unit = canonicalUnit(match[1]);
    if (unit) {
      return { unit, name: match[2].trim() };
    }
  }

  return { unit: '', name: trimmed };
}

/** The unit as it reads next to an amount, e.g. "cups" for 2 but "cup" for 1/2. */
export function unitLabel(unit: string | undefined, amount: number): string {
  if (!unit) {
    return '';
  }

  const labels = UNIT_LABELS[unit];
  if (!labels) {
    return unit;
  }

  return amount > 1 ? labels[1] : labels[0];
}

/** Unit and name together, as shown after the amount: "cups flour", or just "eggs". */
export function ingredientText(ingredient: { unit?: string; name: string }, amount: number): string {
  const label = unitLabel(ingredient.unit, amount);
  return label ? `${label} ${ingredient.name}` : ingredient.name;
}
