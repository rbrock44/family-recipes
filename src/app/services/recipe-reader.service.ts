import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Recipe } from '../models/recipe.interface';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeReaderService {
  recipeTotal = 50;
  FAVORITE_NAME = "family-recipe-favorites"

  constructor(private http: HttpClient) {
  }

  createFilenames(total: number = this.recipeTotal): string[] {
    let array: string[] = []

    for (let i = 1; i < total + 1; i++) {
      let name = i + '';
      if ((i + '').length == 1) {
        name = '000' + i;
      } else if ((i + '').length == 2) {
        name = '00' + i;
      } else if ((i + '').length == 3) {
        name = '0' + i;
      }

      array.push(name)
    }

    return array
  }

  readRecipes(filenames: string[] = this.createFilenames()): Recipe[] {
    let array: Recipe[] = []
    filenames.forEach(async it => {
      const text: string = await this.firstValueFrom(it);
      let recipe = this.convertRecipe(text);
      recipe.filename = it;

      array.push(recipe);
    })

    return array
  }

  convertRecipe(text: string): Recipe {
    let jsonObj = JSON.parse(text);
    return jsonObj as Recipe;
  }

  firstValueFrom(fileNumber: string): Promise<string> {
    return firstValueFrom(this.http.get(`assets/recipes/${fileNumber}.json`, { responseType: 'text' }));
  }

  addToFavorites(fileNumber: string): void {
    let favorites: string[] = this.readFavorites();
    favorites.push(fileNumber);
    this.setFavorites(favorites);
  }

  removeFromFavorites(fileNumber: string): void {
    let favorites: string[] = this.readFavorites();
    favorites = favorites.filter(it => it != fileNumber);
    
    this.setFavorites(favorites);
  }

  readFavorites(): string[] {
    let favs = localStorage.getItem(this.FAVORITE_NAME);
    let favorites: string[] = !!favs ? JSON.parse(favs) : [];
    return favorites;
  }

  private setFavorites(favorites: string[]) {
    localStorage.setItem(this.FAVORITE_NAME, JSON.stringify(favorites));
  }
}
