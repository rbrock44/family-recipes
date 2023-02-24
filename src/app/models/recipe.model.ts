import {Yield} from './yield.model';
import {Ingredient} from './ingredient.model';

export interface Recipe {
  name: string;
  author: string;
  category: number;
  instructions: string;
  filename: string;
  ingredients: Ingredient[];
  yield: Yield;
}
