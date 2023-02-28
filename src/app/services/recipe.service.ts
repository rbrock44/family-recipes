import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { Category } from '../models/category.enum';
import { Recipe } from '../models/recipe.interface';
import { RecipeReaderService } from './recipe-reader.service';


@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private recipes: Recipe[] = [];
  private hooperFamily: string[] = [
    'Rebecca Hooper',
    'C. Allen Collier',
    'Christine Estes',
    'Caleb Estes',
    'Zachary Estes',
    'Cheryl Stone',
    'Catrina Stone',
    'Charlotte Hooper',
    'Joan Drury',
    'Ryan Brock',
    'Sara Hooper',
  ];

  constructor(
    private http: HttpClient,
    private reader: RecipeReaderService
  ) {
    this.load();
  }

  load(): void {
    this.recipes = this.reader.readRecipes();
  }

  search(criteria: string, category: Category = 0, onlyHooperFamily: boolean = false): Recipe[] {
    let list: Recipe[] = [];

    let crit = criteria.toUpperCase().trim();

    if (crit.trim() != '') {
      list = this.recipes.filter(it =>
        it.name.toUpperCase().indexOf(crit) > -1 ||
        it.author.toUpperCase().indexOf(crit) > -1 ||
        it.filename.toUpperCase().indexOf(crit) > -1
      );
    } else {
      list = cloneDeep(this.recipes);
    }


    if (category != 0) {
      list = list.filter(it => it.category == category);
    }

    if (onlyHooperFamily) {
      list = list.filter(it => this.hooperFamily.indexOf(it.author) > -1);
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
}
