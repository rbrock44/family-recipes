import { Ingredient } from './ingredient.interface';
import { Recipe } from './recipe.interface';
import { splitUnit } from '../utils/ingredient-unit.util';

export interface RecipeBatch {
  recipe: Recipe;
  batches: number;
}

// The normalized unit+name grouping key, exposed alongside the display
// fields so callers (e.g. a grocery-list checkbox) have something stable to
// key persisted state on - display `name` stays as whichever ingredient
// name was seen first for the group, with the unit split off into `unit`.
export interface AggregatedIngredient extends Ingredient {
  key: string;
}

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
      const { unit, name } = resolveUnit(ingredient);
      const key = `${unit}|${normalizeCore(name)}`;
      const scaledAmount = ingredient.amount * batches;
      const existing = groups.get(key);

      if (existing) {
        existing.amount += scaledAmount;
      } else {
        groups.set(key, { key, amount: scaledAmount, name, ...(unit ? { unit } : {}) });
      }
    });
  });

  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

// Recipe files store the unit on its own; custom or older entries may still carry it in the name.
function resolveUnit(ingredient: Ingredient): { unit: string; name: string } {
  if (ingredient.unit) {
    return { unit: ingredient.unit, name: ingredient.name.trim() };
  }

  return splitUnit(ingredient.name);
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
