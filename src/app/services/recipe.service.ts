import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { EMPTY_RECIPE, HOOPER_FAMILY } from '../constants/constants';
import { Category } from '../models/category.enum';
import { CookProgress } from '../models/cook-progress.interface';
import { CustomIngredient } from '../models/custom-ingredient.interface';
import { mergeFavorites, SharedFavoritesPayload } from '../models/favorites-share';
import { SharedNotePayload } from '../models/note-share';
import { Recipe } from '../models/recipe.interface';
import { RecipeList } from '../models/recipe-list.interface';
import { RecipeModel } from '../models/recipe.model';
import { RecipeReaderService } from './recipe-reader.service';
import { SeoService } from './seo.service';
import { isListsPath, parseRecipeId, recipePath } from '../utils/recipe-url.util';
import { matchIngredients } from '../utils/ingredient-match.util';
import { authorPeople, matchesAuthor } from '../utils/author-index.util';

/** Marks a history entry the app pushed, and which view it holds when the URL alone can't say. */
export interface RecipeHistoryState {
  app: true;
  lists?: boolean;
  fromLists?: boolean;
  cook?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private recipes: Recipe[] = [];
  private sort: MatSort = new MatSort();
  selectedRecipe: Recipe = {...EMPTY_RECIPE};
  useFavoritesList: boolean = false;
  searchList: string[] = [];
  searchTerm: string = '';
  searchCategory: Category = 0;
  searchHooperFamily: boolean = false;
  // Only recipes with a saved note on this device.
  searchHasNote: boolean = false;
  // Comma-separated ingredients on hand, as typed.
  searchHave: string = '';
  // Only these authors' recipes, picked from Browse by Author or a recipe's byline.
  searchAuthors: string[] = [];
  // Extra ingredients each result needs when searching by what's on hand; ranks the unsorted table.
  private haveExtras: Map<string, number> | null = null;
  hasSearched: boolean = false;
  recentFavoritesExpanded: boolean = false;
  recentExpanded: boolean = true;
  favoritesExpanded: boolean = true;
  showLists: boolean = false;
  openedFromLists: boolean = false;
  // Cook mode sits on its own history entry, so browser/mouse back closes it.
  cookMode: boolean = false;
  activeListId: string | null = null;
  returnScrollY: number = 0;
  selectMode: boolean = false;
  selectedForList: Set<string> = new Set<string>();
  expandedListIds: Set<string>;
  // Tracked as collapsed, not expanded, so new lists start with ingredients open.
  collapsedListIngredientIds: Set<string>;
  // Lists showing the random pick card, kept so it survives opening the recipe and coming back.
  randomPickOpenListIds: Set<string> = new Set<string>();
  favorites: Set<string>;
  // Recipes with a saved note, cached so table rows don't parse storage on every check.
  notedFilenames: Set<string>;
  // Someone else's favorites opened from a share link, held here so the card survives opening a recipe and coming back.
  sharedFavorites: SharedFavoritesPayload | null = null;
  // Someone's note on a recipe, from a share link; shown on that recipe until added or dismissed.
  sharedNote: SharedNotePayload | null = null;

  constructor(
    private reader: RecipeReaderService,
    private location: Location,
    private seo: SeoService,
  ) {
    this.load();
    this.expandedListIds = new Set(this.reader.readExpandedListIds());
    this.collapsedListIngredientIds = new Set(this.reader.readCollapsedListIngredientIds());
    this.favorites = new Set(this.reader.readFavorites());
    this.notedFilenames = new Set(this.reader.readNotedFilenames());

    // Browser/mouse back and forward land here; show whichever view the entry names.
    this.location.subscribe(() => this.restoreFromHistory());
    this.location.onUrlChange(url => this.updateHead(url));
  }

  /** Pushes a history entry so browser/mouse back returns to the view before it. */
  pushView(url: string, state: Omit<RecipeHistoryState, 'app'> = {}): void {
    this.location.go(url, '', { app: true, ...state });
  }

  openCookMode(): void {
    this.cookMode = true;
    this.pushView(this.location.path(), { fromLists: this.openedFromLists, cook: true });
  }

  closeCookMode(): void {
    const state = this.location.getState() as RecipeHistoryState | null;
    // Stepping back drops the cook entry, so forward reopens it like any other view.
    if (state?.cook) {
      this.back();
    } else {
      this.cookMode = false;
    }
  }

  readNote(filename: string): string {
    return this.reader.readNote(filename);
  }

  setNote(filename: string, note: string): void {
    this.reader.setNote(filename, note);

    if (note.trim()) {
      this.notedFilenames.add(filename);
    } else {
      this.notedFilenames.delete(filename);
    }
  }

  hasNote(filename: string): boolean {
    return this.notedFilenames.has(filename);
  }

  readCookProgress(filename: string): CookProgress | undefined {
    return this.reader.readCookProgress(filename);
  }

  setCookProgress(filename: string, progress: CookProgress | null): void {
    this.reader.setCookProgress(filename, progress);
  }

  /** True when the current entry was pushed by the app, so stepping back stays on the site. */
  canGoBack(): boolean {
    return (this.location.getState() as RecipeHistoryState | null)?.app === true;
  }

  back(): void {
    this.location.back();
  }

  /** A recipe's own page, or home (keeping its search params) when null. */
  buildRecipeUrl(recipe: string | null): string {
    if (recipe !== null) {
      return recipePath(recipe, this.recipeName(recipe));
    }

    const query = this.location.path().split('?')[1] ?? '';
    return query ? `/?${query}` : '/';
  }

  /** Seeds the search from a link's `?search=`, `?category=`, `?hooperFamily=`, `?hasNote=`, `?have=` and `?author=`. */
  restoreSearchParams(path: string): void {
    const queryParams = new URLSearchParams(path.split('?')[1] ?? '');
    const category = Number(queryParams.get('category'));

    this.searchTerm = queryParams.get('search') ?? '';
    this.searchCategory = Category[category] !== undefined ? category : 0;
    this.searchHooperFamily = queryParams.get('hooperFamily') === 'true';
    this.searchHasNote = queryParams.get('hasNote') === 'true';
    this.searchHave = queryParams.get('have') ?? '';
    this.searchAuthors = this.peopleIn(queryParams.getAll('author'));
  }

  /** Starts a fresh search for everything the people in one credit wrote. */
  browseAuthor(author: string): void {
    this.searchTerm = '';
    this.searchCategory = 0;
    this.searchHooperFamily = false;
    this.searchHasNote = false;
    this.searchHave = '';
    this.searchAuthors = this.peopleIn([author]);
    this.hasSearched = true;
  }

  /** Each person named across these credits, once. */
  private peopleIn(credits: string[]): string[] {
    const people = credits.flatMap(credit => authorPeople(credit));
    return people.filter((person, i) => people.findIndex(it => matchesAuthor(it, person)) === i);
  }

  listsUrl(): string {
    return '/lists';
  }

  private recipeName(filename: string): string | undefined {
    return this.selectedRecipe.filename === filename
      ? this.selectedRecipe.name
      : this.findRecipe(filename)?.name;
  }

  private restoreFromHistory(): void {
    const recipe = parseRecipeId(this.location.path());
    const state = this.location.getState() as RecipeHistoryState | null;

    if (recipe) {
      this.showLists = false;
      this.openedFromLists = state?.fromLists === true;
      // Opening or closing cook mode stays on the same recipe; no need to fetch it again.
      if (recipe !== this.selectedRecipe.filename) {
        this.readRecipe(recipe);
      }
      this.cookMode = state?.cook === true;
      return;
    }

    this.setEmptyRecipe();
    this.openedFromLists = false;
    this.showLists = isListsPath(this.location.path()) || state?.lists === true;
    if (!this.showLists) {
      this.activeListId = null;
    }

    const scrollY = this.returnScrollY;
    setTimeout(() => window.scrollTo(0, scrollY));
  }

  /** Keeps the title, description and canonical tags on whichever page the URL now names. */
  private updateHead(url: string): void {
    const filename = parseRecipeId(url);
    const recipe = filename
      ? this.selectedRecipe.filename === filename
        ? this.selectedRecipe
        : this.findRecipe(filename)
      : undefined;

    this.seo.update(url, recipe);
  }

  load(): void {
    this.recipes = this.reader.readRecipes();
  }

  isFullyLoaded(): boolean {
    return this.reader.fullyLoaded
  }

  allRecipes(): Recipe[] {
    return this.recipes;
  }

  search(
    criteria: string,
    category: Category = 0,
    onlyHooperFamily: boolean = false,
    have: string[] = [],
    authors: string[] = [],
    onlyWithNotes: boolean = false,
  ): Recipe[] {
    let list: Recipe[] = [];

    let crits = criteria.toUpperCase().trim().split(' ');

    if (crits[0].trim() != '') {
      list = this.recipes.filter(it => this.matchesAllCriteria(crits, it));
    } else {
      list = [...this.recipes]
    }

    if (category != 0) {
      list = list.filter(it => it.category == category);
    }

    if (onlyHooperFamily) {
      list = list.filter(it => HOOPER_FAMILY.indexOf(it.author) > -1);
    }

    if (onlyWithNotes) {
      list = list.filter(it => this.hasNote(it.filename));
    }

    if (authors.length > 0) {
      list = list.filter(it => authors.some(author => matchesAuthor(it.author, author)));
    }

    if (have.length > 0) {
      const matches = matchIngredients(list, have);
      this.haveExtras = new Map(matches.map(it => [it.recipe.filename, it.extra]));
      list = matches.map(it => it.recipe);
    } else {
      this.haveExtras = null;
    }

    list = this.sortData(list, this.sort, false, this.haveExtras)

    return list;
  }

  sortTable(dataSource: MatTableDataSource<Recipe>, sort: MatSort, isMainTable: boolean = true): void {
    dataSource.data = this.sortData(dataSource.data, sort, isMainTable, isMainTable ? this.haveExtras : null)
  }

  /** How many more ingredients a result needs beyond those on hand, when searching by them. */
  extraIngredients(filename: string): number | undefined {
    return this.haveExtras?.get(filename);
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
    if (this.favorites.has(fileNumber)) {
      return;
    }

    this.reader.addToFavorites(fileNumber);
    this.favorites.add(fileNumber);
  }

  isFavorite(fileNumber: string): boolean {
    return this.favorites.has(fileNumber);
  }

  setEmptyRecipe(): void {
    this.cookMode = false;
    this.selectedRecipe = {...EMPTY_RECIPE};
  }

  nextRecipe(): string {
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

    return filename;
  }

  previousRecipe(): string {
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

    return filename;
  }

  removeFromFavorites(fileNumber: string): void {
    this.reader.removeFromFavorites(fileNumber);
    this.favorites.delete(fileNumber);
  }

  readFavorites(): string[] {
    return this.reader.readFavorites();
  }

  /** Adds shared favorites not already favorited; returns how many were new. */
  mergeSharedFavorites(shared: string[]): number {
    const mine = this.readFavorites();
    const added = mergeFavorites(mine, shared).slice(mine.length);

    added.forEach((filename) => this.addToFavorites(filename));

    return added.length;
  }

  addToRecent(fileNumber: string): void {
    this.reader.addToRecent(fileNumber);
  }

  removeFromRecent(fileNumber: string): void {
    this.reader.removeFromRecent(fileNumber);
  }

  readRecent(): string[] {
    return this.reader.readRecent();
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
  }

  toggleSelectedForList(filename: string): void {
    if (this.selectedForList.has(filename)) {
      this.selectedForList.delete(filename);
    } else {
      this.selectedForList.add(filename);
    }
  }

  clearSelectedForList(): void {
    this.selectedForList.clear();
  }

  addCustomIngredient(listId: string, ingredient: CustomIngredient): void {
    this.reader.addCustomIngredient(listId, ingredient);
  }

  removeCustomIngredient(listId: string, ingredientId: string): void {
    this.reader.removeCustomIngredient(listId, ingredientId);
  }

  updateCustomIngredient(listId: string, ingredient: CustomIngredient): void {
    this.reader.updateCustomIngredient(listId, ingredient);
  }

  setListExpanded(id: string, expanded: boolean): void {
    if (expanded) {
      this.expandedListIds.add(id);
    } else {
      this.expandedListIds.delete(id);
    }

    this.reader.setExpandedListIds(Array.from(this.expandedListIds));
  }

  setListIngredientsExpanded(id: string, expanded: boolean): void {
    if (expanded) {
      this.collapsedListIngredientIds.delete(id);
    } else {
      this.collapsedListIngredientIds.add(id);
    }

    this.reader.setCollapsedListIngredientIds(Array.from(this.collapsedListIngredientIds));
  }

  readRandomPicks(listId: string): string[] {
    return this.reader.readRandomPicks(listId);
  }

  setRandomPicks(listId: string, filenames: string[]): void {
    this.reader.setRandomPicks(listId, filenames);
  }

  readRandomCurrent(listId: string): string | undefined {
    return this.reader.readRandomCurrent(listId);
  }

  setRandomCurrent(listId: string, filename: string | null): void {
    this.reader.setRandomCurrent(listId, filename);
  }

  readLists(): RecipeList[] {
    return this.reader.readLists();
  }

  createList(name: string): RecipeList {
    return this.reader.createList(name);
  }

  renameList(id: string, name: string): void {
    this.reader.renameList(id, name);
  }

  deleteList(id: string): void {
    this.reader.deleteList(id);
  }

  addToList(listId: string, filename: string, batches: number): void {
    this.reader.addToList(listId, filename, batches);
  }

  removeFromList(listId: string, filename: string): void {
    this.reader.removeFromList(listId, filename);
  }

  setListRecipeBatches(listId: string, filename: string, batches: number): void {
    this.reader.setListRecipeBatches(listId, filename, batches);
  }

  findListRecipeBatches(listId: string, filename: string): number | undefined {
    const list = this.readLists().find(it => it.id === listId);
    return list?.recipes.find(it => it.filename === filename)?.batches;
  }

  readCheckedIngredients(listId: string): string[] {
    return this.reader.readCheckedIngredients(listId);
  }

  setCheckedIngredients(listId: string, keys: string[]): void {
    this.reader.setCheckedIngredients(listId, keys);
  }

  findRecipe(filename: string): Recipe | undefined {
    return this.recipes.find(it => it.filename === filename);
  }

  readRecipe(filename: string): void {
    if (filename !== this.selectedRecipe.filename) {
      this.cookMode = false;
    }

    this.firstValueFrom(filename).then(it => {
      let recipe = this.convertRecipe(it);
      recipe.filename = filename;
      this.selectedRecipe = recipe;
      this.canonicalizeUrl(recipe);
    }, () => {
      // No such recipe: a mistyped or stale link falls back to home instead of a blank page.
      if (parseRecipeId(this.location.path()) === filename) {
        this.setEmptyRecipe();
        this.location.replaceState('/');
      }
    });
  }

  /** Rewrites `/<id>` or `/<id>/<wrong-name>` to the recipe's real `/<id>/<name>`, keeping history state. */
  private canonicalizeUrl(recipe: Recipe): void {
    const [path, query] = this.location.path().split('?');
    if (parseRecipeId(path) !== recipe.filename) {
      return;
    }

    const canonical = recipePath(recipe.filename, recipe.name);
    if (path !== canonical) {
      this.location.replaceState(canonical, query ?? '', this.location.getState());
    } else {
      // Same URL, but the head tags can now name the recipe.
      this.updateHead(path);
    }
  }

  getSelectedRecipeIndex(): number {
    return this.searchList.indexOf(this.selectedRecipe.filename) + 1;
  }

  private sortData(
    data: Recipe[],
    sort: MatSort,
    isMainTable: boolean = true,
    extras: Map<string, number> | null = null,
  ): Recipe[] {
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
        // Unsorted results from an ingredients search keep their closest-fit order.
        data = extras
          ? data.sort((a, b) => (extras.get(a.filename) ?? 0) - (extras.get(b.filename) ?? 0) || a.name.localeCompare(b.name))
          : this.sortRecipes(data, "filename")
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
