export interface Ingredient {
  name: string;
  amount: number;
  /** Canonical unit from `utils/ingredient-unit.util.ts` ("cup", "tsp"...); absent when there is none. */
  unit?: string;
}
