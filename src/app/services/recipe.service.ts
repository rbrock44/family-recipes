import {Injectable} from '@angular/core';
import {Recipe} from '../models/recipe.model';
import {RecipeReaderService} from './recipe-reader.service';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  recipes: Recipe[] = []

  constructor(private reader: RecipeReaderService) {
    this.recipes = this.reader.readRecipes()
  }

  // search(criteria: string): Recipe[] {
  //   return this.recipes.filter(it => it.name.ind)
  // }
}
