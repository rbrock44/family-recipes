import { Injectable } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { cloneDeep } from 'lodash';
import { EMPTY_RECIPE, HOOPER_FAMILY } from '../constants/constants';
import { Category } from '../models/category.enum';
import { Recipe } from '../models/recipe.interface';
import { RecipeModel } from '../models/recipe.model';
import { RecipeReaderService } from './recipe-reader.service';


@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private recipes: Recipe[] = [];
  private sort: MatSort = new MatSort();
  selectedRecipe: Recipe = cloneDeep(EMPTY_RECIPE);
  useFavoritesList: boolean = false;
  searchList: string[] = [];

  constructor(
    private reader: RecipeReaderService
  ) {
    this.load();
  }

  load(): void {
    this.recipes = this.reader.readRecipes();
  }

  isFullyLoaded(): boolean {
    return this.reader.fullyLoaded
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

    list = this.sortData(list, this.sort, false)

    return list;
  }

  sortTable(dataSource: MatTableDataSource<Recipe>, sort: MatSort, isMainTable: boolean = true): void {
    dataSource.data = this.sortData(dataSource.data, sort, isMainTable)
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
      let index = this.getNextIndex(favorites);
      
      filename = favorites[index];
    } else {
      let index = this.getNextIndex(this.searchList);
      
      filename = this.searchList[index];
    }

    this.readRecipe(filename);
  }
  
  previousRecipe(): void {
    let filename: string = '';
    
    if (this.useFavoritesList) {
      const favorites = this.readFavorites();
      const index = this.getPreviousIndex(favorites);
      
      filename = favorites[index];
    } else {
      const index = this.getPreviousIndex(this.searchList);
      
      filename = this.searchList[index];
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
  
  getSelectedRecipeIndex(): number {
    return this.searchList.indexOf(this.selectedRecipe.filename) + 1;
  }
  
  private sortData(data: Recipe[], sort: MatSort, isMainTable: boolean = true): Recipe[] {
    if (isMainTable) 
      this.sort = sort;

    switch (sort.direction) {
      case 'asc':
        data = this.sortRecipes(data, sort.active)
        sort.direction = 'asc';
        break;
      case 'desc':
        data = this.sortRecipes(data, sort.active, false)
        sort.direction = 'desc';
        break;
      default:
        data = this.sortRecipes(data, "filename")
        sort.direction = '';
    }

    return data
  }

  private sortRecipes(data: Recipe[], column: string, asc: boolean = true): Recipe[] {
    return data.sort((a: Recipe, b: Recipe) => {
      let value1 = RecipeModel.getValue(column, a);
      let value2 = RecipeModel.getValue(column, b);
      if (value1 > value2) {
        return asc ? 1 : -1
      } else if (value1 < value2) {
        return asc ? -1 : 1
      } else {
        return 0
      }
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

  private getNextIndex(list: string[]): number {
    let index = list.indexOf(this.selectedRecipe.filename);
    if (index < list.length - 1) {
      index++;
    } else {
      index = 0;
    }

    return index;
  }

  private getPreviousIndex(list: string[]): number {
    let index = list.indexOf(this.selectedRecipe.filename);
    if (index > 0) {
      index--;
    } else {
      index = list.length - 1;
    }

    return index;
  }
}
