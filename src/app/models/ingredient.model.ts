import {Ingredient} from './ingredient.interface';

export class IngredientModel implements Ingredient {
  name: string = '';
  amount: number = 0;

  public constructor(init?: Partial<IngredientModel>) {
    Object.assign(this, init);
  }
}
