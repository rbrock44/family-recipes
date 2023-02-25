import {Recipe} from './recipe.interface';
import {IngredientModel} from './ingredient.model';
import {YieldModel} from './yield.model';

export class RecipeModel implements Recipe {
  name: string = '';
  author: string = '';
  category: number = 0;
  instructions: string = '';
  filename: string = '';
  ingredients: IngredientModel[] = [];
  yield: YieldModel = {amount: 0, name: ''};

  public constructor(init?: Partial<RecipeModel>) {
    Object.assign(this, init);
  }
}
