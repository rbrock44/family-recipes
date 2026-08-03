import { ListRecipeEntry } from './list-recipe-entry.interface';

export interface RecipeList {
  id: string;
  name: string;
  recipes: ListRecipeEntry[];
}
