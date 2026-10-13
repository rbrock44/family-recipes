/** Where someone is in a recipe's cook mode: which ingredients and steps are checked off. */
export interface CookProgress {
  ingredients: number[];
  steps: number[];
  current: number;
}
