import {Recipe} from './recipe.interface';
import {IngredientModel} from './ingredient.model';
import {YieldModel} from './yield.model';

export class DryConversion  {
  grams: number = 0;
  tablespoons: number = 0;
  teaspoons: number = 0;
  cups: number = 0;
  
  public constructor(cups: number, tablespoons: number, teaspoons: number, grams: number) {
    this.grams = grams;
    this.tablespoons = tablespoons;
    this.teaspoons = teaspoons;
    this.cups = cups;
  }
}
