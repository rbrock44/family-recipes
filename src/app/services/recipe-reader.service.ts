import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Recipe } from '../models/recipe.interface';
import { RecipeList } from '../models/recipe-list.interface';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeReaderService {
  recipeTotal = 1076;
  fullyLoaded = false;
  FAVORITE_NAME = "family-recipe-favorites"
  RECENT_NAME = "family-recipe-recent"
  RECENT_MAX = 10
  LISTS_NAME = "family-recipe-lists"
  CHECKED_INGREDIENTS_NAME = "family-recipe-list-checked-ingredients"
  EXPANDED_LISTS_NAME = "family-recipe-list-expanded"

  constructor(private http: HttpClient) {
  }

  createFilenames(total: number = this.recipeTotal): string[] {
    let array: string[] = []

    for (let i = 1; i < total + 1; i++) {
      let name = this.createFilename(i);

      array.push(name)
    }

    return array
  }

  createFilename(num: number): string {
    let name = num + '';
    if (name.length == 1) {
      name = '000' + num;
    } else if (name.length == 2) {
      name = '00' + num;
    } else if (name.length == 3) {
      name = '0' + num;
    }

    return name
  }

  readRecipes(filenames: string[] = this.createFilenames()): Recipe[] {
    let array: Recipe[] = []
    filenames.forEach(async it => {
      const text: string = await this.firstValueFrom(it);
      let recipe = this.convertRecipe(text);
      recipe.filename = it;

      array.push(recipe);

      if (it === this.createFilename(this.recipeTotal)) {
        this.fullyLoaded = true;
      }
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

  addToRecent(fileNumber: string): void {
    let recent: string[] = this.readRecent().filter(it => it != fileNumber);
    recent.unshift(fileNumber);

    this.setRecent(recent.slice(0, this.RECENT_MAX));
  }

  removeFromRecent(fileNumber: string): void {
    let recent: string[] = this.readRecent();
    recent = recent.filter(it => it != fileNumber);

    this.setRecent(recent);
  }

  readRecent(): string[] {
    let items = localStorage.getItem(this.RECENT_NAME);
    let recent: string[] = !!items ? JSON.parse(items) : [];
    return recent;
  }

  private setRecent(recent: string[]) {
    localStorage.setItem(this.RECENT_NAME, JSON.stringify(recent));
  }

  readLists(): RecipeList[] {
    let items = localStorage.getItem(this.LISTS_NAME);
    let lists: RecipeList[] = !!items ? JSON.parse(items) : [];
    return lists;
  }

  createList(name: string): RecipeList {
    const list: RecipeList = { id: crypto.randomUUID(), name, recipes: [] };
    const lists = this.readLists();
    lists.push(list);

    this.setLists(lists);

    return list;
  }

  renameList(id: string, name: string): void {
    const lists = this.readLists();
    const list = lists.find(it => it.id === id);

    if (list) {
      list.name = name;
      this.setLists(lists);
    }
  }

  deleteList(id: string): void {
    const lists = this.readLists().filter(it => it.id !== id);

    this.setLists(lists);
  }

  addToList(listId: string, filename: string, batches: number): void {
    const lists = this.readLists();
    const list = lists.find(it => it.id === listId);

    if (!list) {
      return;
    }

    const existing = list.recipes.find(it => it.filename === filename);
    if (existing) {
      existing.batches = batches;
    } else {
      list.recipes.push({ filename, batches });
    }

    this.setLists(lists);
  }

  removeFromList(listId: string, filename: string): void {
    const lists = this.readLists();
    const list = lists.find(it => it.id === listId);

    if (!list) {
      return;
    }

    list.recipes = list.recipes.filter(it => it.filename !== filename);

    this.setLists(lists);
  }

  setListRecipeBatches(listId: string, filename: string, batches: number): void {
    const lists = this.readLists();
    const list = lists.find(it => it.id === listId);
    const entry = list?.recipes.find(it => it.filename === filename);

    if (entry) {
      entry.batches = batches;
      this.setLists(lists);
    }
  }

  private setLists(lists: RecipeList[]) {
    localStorage.setItem(this.LISTS_NAME, JSON.stringify(lists));
  }

  // A grocery shopper's checked-off state for a list's aggregated ingredient
  // lines, keyed by the aggregator's normalized unit+name key. Stored
  // separately per list ID so checking things off in one list never touches
  // another's.
  readCheckedIngredients(listId: string): string[] {
    return this.readAllCheckedIngredients()[listId] || [];
  }

  setCheckedIngredients(listId: string, keys: string[]): void {
    const all = this.readAllCheckedIngredients();
    all[listId] = keys;

    localStorage.setItem(this.CHECKED_INGREDIENTS_NAME, JSON.stringify(all));
  }

  private readAllCheckedIngredients(): Record<string, string[]> {
    const items = localStorage.getItem(this.CHECKED_INGREDIENTS_NAME);
    return items ? JSON.parse(items) : {};
  }

  readExpandedListIds(): string[] {
    const items = localStorage.getItem(this.EXPANDED_LISTS_NAME);
    return items ? JSON.parse(items) : [];
  }

  setExpandedListIds(ids: string[]): void {
    localStorage.setItem(this.EXPANDED_LISTS_NAME, JSON.stringify(ids));
  }
}
