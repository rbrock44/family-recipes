import { Recipe } from '../models/recipe.interface';

export interface IngredientMatch {
  recipe: Recipe;
  /** Ingredients the recipe needs beyond the ones asked for. */
  extra: number;
}

/** "chicken, Rice ;broccoli" -> ["chicken", "rice", "broccoli"]. */
export function parseHaveList(value: string | null | undefined): string[] {
  return Array.from(
    new Set(
      (value ?? '')
        .split(/[,;]/)
        .map((it) => it.trim().toLowerCase().replace(/\s+/g, ' '))
        .filter((it) => it !== ''),
    ),
  );
}

/**
 * Recipes that use every ingredient asked for, fewest other ingredients first, so
 * "what can I make with chicken and rice" puts the closest fits on top.
 */
export function matchIngredients(recipes: Recipe[], have: string[]): IngredientMatch[] {
  const patterns = have.map(termPattern);

  return recipes
    .map((recipe) => {
      const names = recipe.ingredients.map((it) => it.name.toLowerCase());
      const used = new Set<number>();

      for (const pattern of patterns) {
        const found = names.reduce<number[]>(
          (hits, name, index) => (pattern.test(name) ? [...hits, index] : hits),
          [],
        );
        if (found.length === 0) {
          return null;
        }
        found.forEach((index) => used.add(index));
      }

      return { recipe, extra: names.length - used.size };
    })
    .filter((it): it is IngredientMatch => it !== null)
    .sort((a, b) => a.extra - b.extra || a.recipe.name.localeCompare(b.recipe.name));
}

// Whole words, either number: "egg" finds "eggs", "tomatoes" finds "tomato", "berry" finds "berries".
function termPattern(term: string): RegExp {
  const stem = singular(term);
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ending = stem.endsWith('y') ? null : '(?:s|es)?';

  return ending
    ? new RegExp(`\\b${escaped}${ending}\\b`)
    : new RegExp(`\\b${escaped.slice(0, -1)}(?:y|ies)\\b`);
}

function singular(term: string): string {
  if (term.length > 4 && term.endsWith('ies')) {
    return `${term.slice(0, -3)}y`;
  }
  if (term.length > 4 && /(?:oes|ches|shes|xes)$/.test(term)) {
    return term.slice(0, -2);
  }
  if (term.length > 3 && term.endsWith('s') && !term.endsWith('ss')) {
    return term.slice(0, -1);
  }
  return term;
}
