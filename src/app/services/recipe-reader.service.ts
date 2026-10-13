import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookProgress } from '../models/cook-progress.interface';
import { CustomIngredient } from '../models/custom-ingredient.interface';
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
  COLLAPSED_LIST_INGREDIENTS_NAME = "family-recipe-list-ingredients-collapsed"
  RANDOM_PICKS_NAME = "family-recipe-list-random-picks"
  RANDOM_CURRENT_NAME = "family-recipe-list-random-current"
  COOK_PROGRESS_NAME = "family-recipe-cook-progress"

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

  readRecipes(): Recipe[] {
    let array: Recipe[] = []

    firstValueFrom(this.http.get<Recipe[]>('assets/recipes.json')).then(recipes => {
      array.push(...recipes);
      this.fullyLoaded = true;
    });

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
    return this.readStorage<string[]>(this.FAVORITE_NAME, []);
  }

  private setFavorites(favorites: string[]) {
    this.writeStorage(this.FAVORITE_NAME, favorites);
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
    return this.readStorage<string[]>(this.RECENT_NAME, []);
  }

  private setRecent(recent: string[]) {
    this.writeStorage(this.RECENT_NAME, recent);
  }

  readLists(): RecipeList[] {
    return this.readStorage<RecipeList[]>(this.LISTS_NAME, []);
  }

  createList(name: string): RecipeList {
    const list: RecipeList = { id: crypto.randomUUID(), name, recipes: [] };
    const lists = this.readLists();
    lists.push(list);

    this.setLists(lists);

    return list;
  }

  renameList(id: string, name: string): void {
    this.updateList(id, list => {
      list.name = name;
    });
  }

  deleteList(id: string): void {
    const lists = this.readLists().filter(it => it.id !== id);

    this.setLists(lists);
  }

  addToList(listId: string, filename: string, batches: number): void {
    this.updateList(listId, list => {
      const existing = list.recipes.find(it => it.filename === filename);
      if (existing) {
        existing.batches = batches;
      } else {
        list.recipes.push({ filename, batches });
      }
    });
  }

  removeFromList(listId: string, filename: string): void {
    this.updateList(listId, list => {
      list.recipes = list.recipes.filter(it => it.filename !== filename);
    });
  }

  setListRecipeBatches(listId: string, filename: string, batches: number): void {
    this.updateList(listId, list => {
      const entry = list.recipes.find(it => it.filename === filename);
      if (entry) {
        entry.batches = batches;
      }
    });
  }

  private setLists(lists: RecipeList[]) {
    this.writeStorage(this.LISTS_NAME, lists);
  }

  private updateList(listId: string, mutate: (list: RecipeList) => void): void {
    const lists = this.readLists();
    const list = lists.find(it => it.id === listId);

    if (!list) {
      return;
    }

    mutate(list);

    this.setLists(lists);
  }

  addCustomIngredient(listId: string, ingredient: CustomIngredient): void {
    this.updateList(listId, list => {
      list.customIngredients = [...(list.customIngredients ?? []), ingredient];
    });
  }

  removeCustomIngredient(listId: string, ingredientId: string): void {
    this.updateList(listId, list => {
      list.customIngredients = (list.customIngredients ?? []).filter(it => it.id !== ingredientId);
    });
  }

  updateCustomIngredient(listId: string, ingredient: CustomIngredient): void {
    this.updateList(listId, list => {
      list.customIngredients = (list.customIngredients ?? []).map(it =>
        it.id === ingredient.id ? ingredient : it
      );
    });
  }

  readCheckedIngredients(listId: string): string[] {
    return this.readAllCheckedIngredients()[listId] || [];
  }

  setCheckedIngredients(listId: string, keys: string[]): void {
    const all = this.readAllCheckedIngredients();
    all[listId] = keys;

    this.writeStorage(this.CHECKED_INGREDIENTS_NAME, all);
  }

  private readAllCheckedIngredients(): Record<string, string[]> {
    return this.readStorage(this.CHECKED_INGREDIENTS_NAME, {});
  }

  readExpandedListIds(): string[] {
    return this.readStorage(this.EXPANDED_LISTS_NAME, []);
  }

  setExpandedListIds(ids: string[]): void {
    this.writeStorage(this.EXPANDED_LISTS_NAME, ids);
  }

  readCollapsedListIngredientIds(): string[] {
    return this.readStorage(this.COLLAPSED_LIST_INGREDIENTS_NAME, []);
  }

  setCollapsedListIngredientIds(ids: string[]): void {
    this.writeStorage(this.COLLAPSED_LIST_INGREDIENTS_NAME, ids);
  }

  readRandomPicks(listId: string): string[] {
    return this.readAllRandomPicks()[listId] || [];
  }

  setRandomPicks(listId: string, filenames: string[]): void {
    const all = this.readAllRandomPicks();
    all[listId] = filenames;
    this.writeStorage(this.RANDOM_PICKS_NAME, all);
  }

  private readAllRandomPicks(): Record<string, string[]> {
    return this.readStorage(this.RANDOM_PICKS_NAME, {});
  }

  readRandomCurrent(listId: string): string | undefined {
    return this.readAllRandomCurrent()[listId];
  }

  setRandomCurrent(listId: string, filename: string | null): void {
    const all = this.readAllRandomCurrent();

    if (filename) {
      all[listId] = filename;
    } else {
      delete all[listId];
    }

    this.writeStorage(this.RANDOM_CURRENT_NAME, all);
  }

  private readAllRandomCurrent(): Record<string, string> {
    return this.readStorage(this.RANDOM_CURRENT_NAME, {});
  }

  readCookProgress(filename: string): CookProgress | undefined {
    return this.readAllCookProgress()[filename];
  }

  setCookProgress(filename: string, progress: CookProgress | null): void {
    const all = this.readAllCookProgress();

    if (progress) {
      all[filename] = progress;
    } else {
      delete all[filename];
    }

    this.writeStorage(this.COOK_PROGRESS_NAME, all);
  }

  private readAllCookProgress(): Record<string, CookProgress> {
    return this.readStorage(this.COOK_PROGRESS_NAME, {});
  }

  // Corrupt values or blocked storage (some private modes) should not break the page.
  private readStorage<T>(key: string, fallback: T): T {
    try {
      const items = localStorage.getItem(key);
      return items ? JSON.parse(items) : fallback;
    } catch {
      return fallback;
    }
  }

  private writeStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable or full; changes just will not persist.
    }
  }
}
