import {Recipe} from './recipe.interface';
import {IngredientModel} from './ingredient.model';
import {YieldModel} from './yield.model';

export class LiquidConversion  {
  gallons: number = 0;
  quarts: number = 0;
  pints: number = 0;
  cups: number = 0;
  
  public constructor(gallons: number, cups: number, quarts: number, pints: number, ) {
    this.gallons = gallons;
    this.quarts = quarts;
    this.pints = pints;
    this.cups = cups;
  }
}
