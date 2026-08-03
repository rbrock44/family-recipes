import {Yield} from './yield.interface';
import {Ingredient} from './ingredient.interface';

export interface Recipe {
  name: string;
  author: string;
  category: number;
  instructions: string;
  filename: string;
  link?: string;
  additionalLinks?: string[];
  ingredients: Ingredient[];
  url?: string;
  yield: Yield;
}
