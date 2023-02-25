import {Injectable} from '@angular/core';
import {Recipe} from '../models/recipe.interface';
import {RecipeReaderService} from './recipe-reader.service';
import {Category} from '../models/category.enum';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private recipes: Recipe[] = [];
  private hooperFamily: string[] = [
    'Rebecca Hooper',
    'Christin Estes',
    'Cheryl Hooper',
    'Charlotte Hooper',
    'Joan Drury',
  ];

  constructor(private reader: RecipeReaderService) {
    this.recipes = this.reader.readRecipes();
  }

  search(criteria: string, category: Category = 0, onlyHooperFamily: boolean = false): Recipe[] {
    let list = this.recipes.filter(it =>
      it.name.indexOf(criteria) > -1 || it.author.indexOf(criteria) > -1 || it.filename.indexOf(criteria) > -1
    );

    if (category != 0) {
      list = list.filter(it => it.category == category);
    }

    if (onlyHooperFamily) {
      list = list.filter(it => this.hooperFamily.indexOf(it.author) > -1);
    }

    return list;
  }

  getRecipe(filename: string): Recipe {
    return this.recipes.filter(it => it.filename == filename)[0];
  }
}
