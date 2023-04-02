import { Injectable } from '@angular/core';
import { clone, cloneDeep } from 'lodash';
import { EMPTY_RECIPE, HOOPER_FAMILY } from '../constants/constants';
import { Category } from '../models/category.enum';
import { Recipe } from '../models/recipe.interface';
import { RecipeReaderService } from './recipe-reader.service';


@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private recipes: Recipe[] = [];
  selectedRecipe: Recipe = cloneDeep(EMPTY_RECIPE);
  useFavoritesList: boolean = false;

  constructor(
    private reader: RecipeReaderService
  ) {
    this.load();
  }

  load(): void {
    this.recipes = this.reader.readRecipes();
  }

  search(criteria: string, category: Category = 0, onlyHooperFamily: boolean = false): Recipe[] {
    let list: Recipe[] = [];

    let crits = criteria.toUpperCase().trim().split(' ');

    if (crits[0].trim() != '') {
      list = this.recipes.filter(it => this.matchesAllCriteria(crits, it));
    } else {
      list = cloneDeep(this.recipes);
    }

    if (category != 0) {
      list = list.filter(it => it.category == category);
    }

    if (onlyHooperFamily) {
      list = list.filter(it => HOOPER_FAMILY.indexOf(it.author) > -1);
    }

    return list;
  }

  readFile(fileNumber: string): void {
    const text = this.reader.firstValueFrom(fileNumber);

    text.then(value => {
      let recipe = this.reader.convertRecipe(value);
      recipe.filename = fileNumber;

      this.recipes.push(recipe)
    })
  }

  firstValueFrom(fileNumber: string): Promise<string> {
    return this.reader.firstValueFrom(fileNumber);
  }

  convertRecipe(text: string): Recipe {
    return this.reader.convertRecipe(text);
  }

  addToFavorites(fileNumber: string): void {
    this.reader.addToFavorites(fileNumber);
  }

  setEmptyRecipe(): void {
    this.selectedRecipe = cloneDeep(EMPTY_RECIPE);
  }

  nextRecipe(): void {
    let filename: string = '';

    if (this.useFavoritesList) {
      const favorites = this.readFavorites();
      let index = favorites.indexOf(this.selectedRecipe.filename);
      if (index < favorites.length - 1) {
        index++;
      } else {
        index = 0;
      }

      filename = favorites[index];
    } else {
      let numberToLoad = +this.selectedRecipe.filename + 1;
      if (numberToLoad >= this.reader.recipeTotal) {
        numberToLoad = 1
      }

      filename = this.reader.createFilename(numberToLoad);
    }

    this.readRecipe(filename);
  }

  previousRecipe(): void {
    let filename: string = '';

    if (this.useFavoritesList) {
      const favorites = this.readFavorites();
      let index = favorites.indexOf(this.selectedRecipe.filename);
      if (index > 0) {
        index--;
      } else {
        index = favorites.length - 1;
      }

      filename = favorites[index];
    } else {
      let numberToLoad = +this.selectedRecipe.filename - 1;
      if (numberToLoad <= 1) {
        numberToLoad = this.reader.recipeTotal
      }

      filename = this.reader.createFilename(numberToLoad);
    }

    this.readRecipe(filename);
  }

  removeFromFavorites(fileNumber: string): void {
    this.reader.removeFromFavorites(fileNumber);
  }

  readFavorites(): string[] {
    return this.reader.readFavorites();
  }

  readRecipe(filename: string): void {
    this.firstValueFrom(filename).then(it => {
      let recipe = cloneDeep(this.convertRecipe(it));
      recipe.filename = filename;
      this.selectedRecipe = recipe;
    });
  }

  private matchesAllCriteria(criteria: string[], recipe: Recipe): boolean {
    let value = true;

    criteria.forEach(it => {
      value = value && (recipe.name.toUpperCase().indexOf(it) > -1 ||
        recipe.author.toUpperCase().indexOf(it) > -1 ||
        recipe.filename.toUpperCase().indexOf(it) > -1)
    })

    return value;
  }
}
