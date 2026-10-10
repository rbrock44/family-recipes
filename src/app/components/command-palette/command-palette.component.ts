import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  signal,
  untracked,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Recipe } from '../../models/recipe.interface';
import { CommandPaletteService } from '../../services/command-palette.service';
import { RecipeService } from '../../services/recipe.service';
import {
  PaletteEntry,
  PalettePage,
  searchEntries,
  toRecipeEntry,
} from '../../utils/palette-search.util';

interface PaletteItem {
  entry: PaletteEntry;
  index: number;
}

interface PaletteSection {
  label: string;
  items: PaletteItem[];
}

const PAGES: PaletteEntry[] = [
  {
    key: 'page-home',
    title: 'Home',
    detail: 'Search, favorites and recently visited',
    icon: 'home',
    keywords: 'search favorites recent',
    page: 'home',
  },
  {
    key: 'page-lists',
    title: 'Lists',
    detail: 'Shopping lists and combined ingredients',
    icon: 'list_alt',
    keywords: 'shopping grocery ingredients',
    page: 'lists',
  },
];

/** How far the page must move before the floating button reacts, so small jitters don't flicker it. */
const SCROLL_THRESHOLD = 4;
const SHOW_NEAR_TOP = 80;
const LOAD_POLL_MS = 250;

@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon],
})
export class CommandPaletteComponent {
  private readonly service = inject(RecipeService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  readonly palette = inject(CommandPaletteService);

  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly fabHidden = signal(false);
  readonly loading = signal(true);
  private readonly recipeEntries = signal<PaletteEntry[]>([]);
  private readonly recent = signal<string[]>([]);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  private returnFocusTo: HTMLElement | null = null;

  /** With no query: recent, pages, then every other recipe. With a query: ranked matches. */
  readonly sections = computed<PaletteSection[]>(() => {
    const query = this.query().trim();
    const recipes = this.recipeEntries();
    const groups: { label: string; entries: PaletteEntry[] }[] = [];

    if (query) {
      groups.push({ label: 'Results', entries: searchEntries([...PAGES, ...recipes], query) });
    } else {
      const byFilename = new Map(recipes.map(entry => [entry.recipe!.filename, entry]));
      const recent = this.recent()
        .map(filename => byFilename.get(filename))
        .filter((entry): entry is PaletteEntry => !!entry);
      const shown = new Set(recent.map(entry => entry.key));
      groups.push(
        { label: 'Recent', entries: recent },
        { label: 'Pages', entries: PAGES },
        { label: 'All recipes', entries: recipes.filter(entry => !shown.has(entry.key)) },
      );
    }

    let index = 0;
    return groups
      .filter(group => group.entries.length > 0)
      .map(group => ({
        label: group.label,
        items: group.entries.map(entry => ({ entry, index: index++ })),
      }));
  });

  readonly items = computed(() => this.sections().flatMap(section => section.items));
  readonly activeId = computed(() =>
    this.items().length > 0 ? `palette-option-${this.activeIndex()}` : null,
  );

  constructor() {
    this.waitForRecipes();

    // Opening can come from the shortcut, the header button or the floating button, so reset on the state change.
    effect(() => {
      if (this.palette.isOpen()) {
        untracked(() => {
          this.returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          this.recent.set(this.service.readRecent());
          this.query.set('');
          this.activeIndex.set(0);
        });
      }
    });
    effect(() => {
      this.input()?.nativeElement.focus();
    });

    afterNextRender(() => this.watchScroll());
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    const isSlash = event.key === '/' && !this.isTyping(event.target);

    if (isShortcut || (isSlash && !this.palette.isOpen())) {
      event.preventDefault();
      if (this.palette.isOpen()) {
        this.close();
      } else {
        this.palette.open();
      }
    }
  }

  close(): void {
    this.palette.close();
    this.returnFocusTo?.focus();
    this.returnFocusTo = null;
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.items().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (count) this.setActive((this.activeIndex() + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) this.setActive((this.activeIndex() - 1 + count) % count);
        break;
      case 'Enter': {
        event.preventDefault();
        const item = this.items()[this.activeIndex()];
        if (item) this.go(item.entry);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        // The input is the only keyboard stop inside the dialog; keep focus there.
        event.preventDefault();
        break;
    }
  }

  go(entry: PaletteEntry): void {
    this.palette.close();
    this.returnFocusTo = null;

    if (entry.recipe) {
      this.openRecipe(entry.recipe);
    } else if (entry.page) {
      this.openPage(entry.page);
    }
  }

  private openRecipe(recipe: Recipe): void {
    // Header previous/next then steps through what the palette was showing.
    const query = this.query().trim();
    const list = query ? searchEntries(this.recipeEntries(), query) : this.recipeEntries();
    this.service.useFavoritesList = false;
    this.service.searchList = list.map(entry => entry.recipe!.filename);

    // Only the home and lists views have a scroll position worth returning to.
    if (this.service.selectedRecipe.filename === '') {
      this.service.returnScrollY = window.scrollY;
    }

    this.service.selectRecipe(recipe);
    this.service.addToRecent(recipe.filename);
    this.service.showLists = false;
    this.service.openedFromLists = false;
    this.service.activeListId = null;
    this.service.pushView(this.service.buildRecipeUrl(recipe.filename));
    window.scrollTo(0, 0);
  }

  private openPage(page: PalettePage): void {
    if (page === 'lists') {
      this.service.returnScrollY = window.scrollY;
      this.service.showLists = true;
      this.service.pushView(this.service.listsUrl(), { lists: true });
      return;
    }

    this.service.setEmptyRecipe();
    this.service.showLists = false;
    this.service.openedFromLists = false;
    this.service.activeListId = null;
    this.service.pushView(this.service.buildRecipeUrl(null));
  }

  private setActive(index: number): void {
    this.activeIndex.set(index);
    document.getElementById(`palette-option-${index}`)?.scrollIntoView?.({ block: 'nearest' });
  }

  private isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    );
  }

  /** The recipe bundle arrives over http after startup and isn't observable, so poll like the home page does. */
  private waitForRecipes(): void {
    if (this.service.isFullyLoaded()) {
      this.loadRecipes();
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const interval = setInterval(() => {
        if (this.service.isFullyLoaded()) {
          clearInterval(interval);
          this.ngZone.run(() => this.loadRecipes());
        }
      }, LOAD_POLL_MS);
      this.destroyRef.onDestroy(() => clearInterval(interval));
    });
  }

  private loadRecipes(): void {
    const entries = this.service
      .allRecipes()
      .map(toRecipeEntry)
      .sort((a, b) => a.title.localeCompare(b.title));
    this.recipeEntries.set(entries);
    this.loading.set(false);
  }

  /** Slides the floating button away while scrolling down and back on scroll up, like mobile toolbars. */
  private watchScroll(): void {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      let hidden = this.fabHidden();

      if (y < SHOW_NEAR_TOP) {
        hidden = false;
      } else if (y > lastY + SCROLL_THRESHOLD) {
        hidden = true;
      } else if (y < lastY - SCROLL_THRESHOLD) {
        hidden = false;
      } else {
        return;
      }

      lastY = y;
      if (hidden !== this.fabHidden()) {
        this.ngZone.run(() => this.fabHidden.set(hidden));
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', onScroll, { passive: true });
    });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    });
  }
}
