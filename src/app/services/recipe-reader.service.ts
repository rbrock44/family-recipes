import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Recipe} from '../models/recipe.interface';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeReaderService {
  recipeTotal = 0;

  constructor(private http: HttpClient) {
  }

  createFilenames(total: number = this.recipeTotal): string[] {
    let array: string[] = []

    for (let i = 1; i < total + 1; i++) {
      let name = i + '';
      if ((i + '').length == 1) {
        name = '00' + i;
      } else if ((i + '').length == 2) {
        name = '0' + i;
      }

      array.push(name)
    }

    return array
  }

  readRecipes(filenames: string[] = this.createFilenames()): Recipe[] {
    let array: Recipe[] = []
    filenames.forEach(async it => {
      const text: string = await firstValueFrom(this.http.get(`assets/recipes/${it}.json`, {responseType: 'text'}))
      let recipe = this.convertRecipe(text);
      recipe.filename = it;
      array.push()
    })

    return array
  }

  convertRecipe(text: string): Recipe {
    let jsonObj = JSON.parse(text);
    return jsonObj as Recipe;
  }
}
