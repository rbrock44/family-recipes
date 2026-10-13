import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CATEGORIES, getCategory } from 'src/app/models/category.enum';
import {
  decodeSharedFavorites,
  encodeSharedFavorites,
} from 'src/app/models/favorites-share';
import { decodeSharedList } from 'src/app/models/list-share';
import { decodeSharedNote } from 'src/app/models/note-share';
import { Recipe } from '../../models/recipe.interface';
import { RecipeService } from '../../services/recipe.service';
import { Location } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatFormField,
  MatHint,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { AboutDialogComponent } from '../../components/about-dialog/about-dialog.component';
import { RecipeTableComponent } from '../../components/recipe-table/recipe-table.component';
import { isListsPath, parseRecipeId } from '../../utils/recipe-url.util';
import { parseHaveList } from '../../utils/ingredient-match.util';
import { AuthorEntry, filterAuthors, indexAuthors } from '../../utils/author-index.util';

/** Authors shown before "Show all", so the card stays short. */
const AUTHOR_PREVIEW = 24;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatIcon,
    MatButton,
    MatProgressSpinner,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    ReactiveFormsModule,
    MatIconButton,
    MatSuffix,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatCheckbox,
    MatSelect,
    MatOption,
    RecipeTableComponent,
  ],
})
export class HomeComponent implements OnInit {
  title = 'family-recipes';
  panelOpenState = false;
  advancedExpanded = false;
  searchControl: FormControl;
  categoryControl: FormControl;
  familyControl: FormControl;
  haveControl: FormControl;
  authorQueryControl = new FormControl('');
  authors: AuthorEntry[] = [];
  showAllAuthors = false;

  dataSource = new MatTableDataSource<Recipe>();
  favoritesDataSource = new MatTableDataSource<Recipe>();
  recentDataSource = new MatTableDataSource<Recipe>();
  sharedFavoritesDataSource = new MatTableDataSource<Recipe>();
  justSharedFavorites = false;
  sharedFavoritesAdded: number | null = null;

  categories = CATEGORIES;

  constructor(
    public service: RecipeService,
    private location: Location,
    private dialog: MatDialog,
  ) {
    // Only a fresh page load reads the URL; coming back from a recipe keeps the live search.
    if (!this.service.hasSearched) {
      this.service.restoreSearchParams(this.location.path());
    }

    // A linked filter would otherwise sit hidden in the collapsed panel.
    this.advancedExpanded =
      this.service.searchCategory !== 0 || this.service.searchHooperFamily || this.service.searchHave !== '';
    this.searchControl = new FormControl(this.service.searchTerm);
    this.categoryControl = new FormControl(this.service.searchCategory);
    this.familyControl = new FormControl(this.service.searchHooperFamily);
    this.haveControl = new FormControl(this.service.searchHave);
  }

  ngOnInit(): void {
    // document.querySelectorAll('[type=search]').forEach((element) => {
    //   this.blurKeyboard(element);
    // });
    this.importSharedList();
    this.importSharedFavorites();
    this.importSharedNote();
    this.restoreListsLink();

    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe((value) => {
        this.search(value);
      });

    this.familyControl.valueChanges
      .pipe(debounceTime(100), distinctUntilChanged())
      .subscribe(() => {
        this.search();
      });

    this.haveControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.search();
      });

    this.loadFavorites();
    this.loadRecent();
    this.loadSharedFavorites();

    if (this.service.isFullyLoaded()) {
      this.restoreSearch();
    } else {
      const interval = setInterval(() => {
        if (this.service.isFullyLoaded()) {
          clearInterval(interval);
          this.restoreSearch();
        }
      }, 250); // check every 0.25 seconds
    }
  }

  private importSharedList(): void {
    const queryParams = new URLSearchParams(window.location.search);
    const shared = queryParams.get('sharedList');

    if (!shared) {
      return;
    }

    try {
      const payload = decodeSharedList(shared);
      const existingNames = this.service.readLists().map((it) => it.name);
      const name = existingNames.includes(payload.name)
        ? `${payload.name} (Shared)`
        : payload.name;

      const list = this.service.createList(name);
      payload.recipes.forEach((entry) => {
        this.service.addToList(list.id, entry.filename, entry.batches);
      });

      this.service.showLists = true;
    } catch {
      // Malformed/tampered link - ignore rather than crash the app.
    }

    queryParams.delete('sharedList');
    const query = queryParams.toString();
    this.location.replaceState(query ? `/?${query}` : '/');

    // Slot the list view in above a home entry so browser/mouse back lands on home.
    if (this.service.showLists) {
      this.service.pushView(this.service.listsUrl(), { lists: true });
    }
  }

  // Unlike shared lists, shared favorites are only shown - merging is the viewer's call.
  private importSharedFavorites(): void {
    const queryParams = new URLSearchParams(window.location.search);
    const shared = queryParams.get('sharedFavorites');

    if (!shared) {
      return;
    }

    try {
      this.service.sharedFavorites = decodeSharedFavorites(shared);
    } catch {
      // Malformed/tampered link - ignore rather than crash the app.
    }

    queryParams.delete('sharedFavorites');
    const query = queryParams.toString();
    this.location.replaceState(query ? `/?${query}` : '/');
  }

  // A shared note rides on the recipe's own link; the recipe page offers to add it.
  private importSharedNote(): void {
    const queryParams = new URLSearchParams(window.location.search);
    const shared = queryParams.get('sharedNote');

    if (!shared) {
      return;
    }

    try {
      this.service.sharedNote = decodeSharedNote(shared);
    } catch {
      // Malformed/tampered link - ignore rather than crash the app.
    }

    queryParams.delete('sharedNote');
    const query = queryParams.toString();
    this.location.replaceState(window.location.pathname + (query ? `?${query}` : ''));
  }

  /** A `/lists` deep link opens the lists view, with a home entry under it like a recipe link. */
  private restoreListsLink(): void {
    if (this.service.showLists || !isListsPath(this.location.path())) {
      return;
    }

    this.service.showLists = true;
    this.location.replaceState('/');
    this.service.pushView(this.service.listsUrl(), { lists: true });
  }

  visibleAuthors(): AuthorEntry[] {
    const query = this.authorQueryControl.value ?? '';
    const matches = filterAuthors(this.authors, query);

    return this.showAllAuthors || query.trim() !== '' ? matches : matches.slice(0, AUTHOR_PREVIEW);
  }

  hiddenAuthorCount(): number {
    return this.authors.length - this.visibleAuthors().length;
  }

  toggleAuthors(): void {
    this.service.authorsExpanded = !this.service.authorsExpanded;
  }

  isAuthorSelected(author: string): boolean {
    return this.service.searchAuthors.includes(author);
  }

  /** Adds the author to the filter, or takes them back out if already in it. */
  toggleAuthor(author: string): void {
    const authors = this.service.searchAuthors;
    this.service.searchAuthors = authors.includes(author)
      ? authors.filter((it) => it !== author)
      : [...authors, author];
    this.search();
  }

  clearAuthors(): void {
    this.service.searchAuthors = [];
    this.search();
  }

  private restoreSearch(): void {
    this.authors = indexAuthors(this.service.allRecipes());

    // The table is always on screen, so a blank box is just an empty search
    // that lists everything.
    this.search(this.searchControl.value);
    this.service.searchList = this.dataSource.data.map((item) => item.filename);

    const recipeParam = parseRecipeId(this.location.path());

    if (recipeParam) {
      this.service.openedFromLists = false;
      this.service.activeListId = null;
      this.service.readRecipe(recipeParam);

      // Slot a home entry in underneath a recipe deep link so browser/mouse back lands on home.
      this.location.replaceState(this.service.buildRecipeUrl(null));
      this.service.pushView(this.service.buildRecipeUrl(recipeParam));
    }
  }

  blurKeyboard(element: HTMLElement) {
    element.addEventListener('keyup', (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.code === 'Enter') {
        element.blur();
      }
    });
  }

  search(value: string = this.searchControl.value): void {
    this.service.hasSearched = true;
    this.service.searchTerm = value;
    this.service.searchCategory = this.categoryControl.value;
    this.service.searchHooperFamily = this.familyControl.value;
    this.service.searchHave = this.haveControl.value ?? '';

    this.dataSource.data = this.service.search(
      value,
      this.categoryControl.value,
      this.familyControl.value,
      parseHaveList(this.haveControl.value),
      this.service.searchAuthors,
    );

    this.location.replaceState(
      this.buildUrl(
        value,
        this.categoryControl.value,
        this.familyControl.value,
        this.haveControl.value,
        this.service.searchAuthors,
      ),
    );
  }

  getCategory(categoryNumber: number): string {
    return getCategory(categoryNumber);
  }

  openAbout(): void {
    this.dialog.open(AboutDialogComponent, { autoFocus: 'dialog' });
  }

  goToLists(): void {
    this.service.returnScrollY = window.scrollY;
    this.service.showLists = true;
    this.service.pushView(this.service.listsUrl(), { lists: true });
  }

  toggleRecentFavorites(): void {
    this.service.recentFavoritesExpanded =
      !this.service.recentFavoritesExpanded;
  }

  toggleRecent(): void {
    this.service.recentExpanded = !this.service.recentExpanded;
  }

  toggleFavorites(): void {
    this.service.favoritesExpanded = !this.service.favoritesExpanded;
  }

  loadFavorites(): void {
    this.resolveRecipes(this.service.readFavorites()).then((recipes) => {
      this.favoritesDataSource.data = recipes;
    });
  }

  loadSharedFavorites(): void {
    const shared = this.service.sharedFavorites;

    if (!shared) {
      this.sharedFavoritesDataSource.data = [];
      return;
    }

    // A shared link can name recipes this copy of the site does not have; skip those.
    Promise.allSettled(
      shared.favorites.map((filename) => this.resolveRecipes([filename])),
    ).then((results) => {
      this.sharedFavoritesDataSource.data = results.flatMap((it) =>
        it.status === 'fulfilled' ? it.value : [],
      );
    });
  }

  sharedFavoritesTitle(): string {
    const name = this.service.sharedFavorites?.name;
    return name ? `${name}'s Favorites` : 'Shared Favorites';
  }

  shareFavorites(): void {
    const name = window.prompt(
      'Add your name so they know whose favorites these are (optional):',
    );

    if (name === null) {
      return;
    }

    const encoded = encodeSharedFavorites({
      name: name.trim(),
      favorites: this.favoritesDataSource.data.map((recipe) => recipe.filename),
    });

    const url = new URL('/', location.href);
    url.searchParams.set('sharedFavorites', encoded);
    const shareUrl = url.toString();

    navigator.clipboard.writeText(shareUrl).then(
      () => {
        this.justSharedFavorites = true;
        setTimeout(() => {
          this.justSharedFavorites = false;
        }, 2000);
      },
      () => {
        window.alert(`Copy this link to share your favorites:\n\n${shareUrl}`);
      },
    );
  }

  mergeSharedFavorites(): void {
    this.sharedFavoritesAdded = this.service.mergeSharedFavorites(
      this.sharedFavoritesDataSource.data.map((recipe) => recipe.filename),
    );
    this.service.recentFavoritesExpanded = true;
    this.service.favoritesExpanded = true;
    this.loadFavorites();
  }

  dismissSharedFavorites(): void {
    this.service.sharedFavorites = null;
    this.sharedFavoritesAdded = null;
    this.sharedFavoritesDataSource.data = [];
  }

  loadRecent(): void {
    this.resolveRecipes(this.service.readRecent()).then((recipes) => {
      this.recentDataSource.data = recipes;
    });
  }

  private resolveRecipes(filenames: string[]): Promise<Recipe[]> {
    return Promise.all(
      filenames.map((filename) => {
        const cached = this.service.findRecipe(filename);
        if (cached) {
          return Promise.resolve(cached);
        }

        return this.service.firstValueFrom(filename).then((contents) => {
          let recipe = this.service.convertRecipe(contents);
          recipe.filename = filename;
          return recipe;
        });
      }),
    );
  }

  private buildUrl(
    search: string,
    category: number,
    hooperFamily: boolean,
    have: string = '',
    authors: string[] = [],
  ): string {
    const queryParams = new URLSearchParams();

    if (search) {
      queryParams.set('search', search);
    }

    if (category !== 0) {
      queryParams.set('category', category.toString());
    }

    if (hooperFamily) {
      queryParams.set('hooperFamily', hooperFamily ? 'true' : 'false');
    }

    const haveList = parseHaveList(have);
    if (haveList.length > 0) {
      queryParams.set('have', haveList.join(', '));
    }

    authors.forEach((author) => queryParams.append('author', author));

    const end = queryParams.toString();
    if (end !== '') {
      return `${location.pathname}?${queryParams.toString()}`;
    } else {
      return location.pathname;
    }
  }
}
