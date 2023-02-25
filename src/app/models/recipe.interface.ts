import {Yield} from './yield.interface';
import {Ingredient} from './ingredient.interface';

export interface Recipe {
  name: string;
  author: string;
  category: number;
  instructions: string;
  filename: string;
  ingredients: Ingredient[];
  yield: Yield;
}
