import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HomeComponent } from './home.component';
import { RecipeService } from '../../services/recipe.service';
import { MatDialog } from '@angular/material/dialog';
import { AboutDialogComponent } from '../../components/about-dialog/about-dialog.component';
import {
  clickElement,
  expectElementPresent,
  expectElementToContainContent,
} from '../../constants/expectations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { EMPTY_RECIPE } from '../../constants/constants';
import { decodeSharedFavorites } from '../../models/favorites-share';
import { encodeSharedNote } from '../../models/note-share';
import { Recipe } from '../../models/recipe.interface';
import { Location } from '@angular/common';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, RouterTestingModule, HomeComponent],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'family-recipes'`, () => {
    expectElementToContainContent(fixture, 'h1', 'Family Recipes');
  });

  it('should have search input', () => {
    // the search panel sits behind a loading guard, so the recipes have to
    // report as loaded before it renders
    vi.spyOn(TestBed.inject(RecipeService), 'isFullyLoaded').mockReturnValue(true);
    fixture.detectChanges();

    expectElementPresent(fixture, '[data-search-input]');
    expectElementPresent(fixture, 'input');
    // scoped to the search button, since the page renders other icons first
    expectElementToContainContent(fixture, '[aria-label="Search"] mat-icon', 'search');
  });

  it('should search by ingredients on hand and keep them in the URL', () => {
    const service = TestBed.inject(RecipeService);
    vi.spyOn(service, 'isFullyLoaded').mockReturnValue(true);
    const search = vi.spyOn(service, 'search').mockReturnValue([]);
    fixture.detectChanges();

    component.haveControl.setValue('Chicken, rice,');
    component.search('');

    expect(search).toHaveBeenLastCalledWith('', 0, false, ['chicken', 'rice'], '');
    expect(service.searchHave).toBe('Chicken, rice,');
    expect(new URLSearchParams(TestBed.inject(Location).path().split('?')[1]).get('have')).toBe('chicken, rice');
  });

  it('should open the advanced panel when a link has ingredients on hand', () => {
    TestBed.inject(Location).replaceState('/?have=rice');

    const opened = TestBed.createComponent(HomeComponent).componentInstance;

    expect(opened.advancedExpanded).toBe(true);
    expect(opened.haveControl.value).toBe('rice');
  });

  describe('browse by author', () => {
    let service: RecipeService;
    const recipes = [
      { ...EMPTY_RECIPE, filename: '0001', name: 'Pie', author: 'Anne Brock' },
      { ...EMPTY_RECIPE, filename: '0002', name: 'Cake', author: 'Anne Brock' },
      { ...EMPTY_RECIPE, filename: '0003', name: 'Stew', author: 'Charlotte Hooper' },
    ];

    beforeEach(() => {
      service = TestBed.inject(RecipeService);
      vi.spyOn(service, 'isFullyLoaded').mockReturnValue(true);
      vi.spyOn(service, 'allRecipes').mockReturnValue(recipes);
      fixture.detectChanges();
    });

    const chips = () => Array.from(fixture.nativeElement.querySelectorAll('[data-author-chip]')) as HTMLElement[];

    it('lists authors with counts once opened', () => {
      expect(chips().length).toBe(0);

      clickElement(fixture, '[data-authors-toggle]');
      fixture.detectChanges();

      const text = (selector: string) => chips().map(it => it.querySelector(selector)?.textContent?.trim());
      expect(text('.author-name')).toEqual(['Anne Brock', 'Charlotte Hooper']);
      expect(text('.author-count')).toEqual(['2', '1']);
      expect(chips().map(it => it.classList.contains('family'))).toEqual([false, true]);
    });

    it('narrows the list by name', () => {
      clickElement(fixture, '[data-authors-toggle]');
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('[data-author-query]') as HTMLInputElement;
      input.value = 'hoop';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(chips().length).toBe(1);
    });

    it('filters results to the author picked, and clears back to everyone', () => {
      const search = vi.spyOn(service, 'search');
      clickElement(fixture, '[data-authors-toggle]');
      fixture.detectChanges();

      chips()[0].click();
      fixture.detectChanges();

      expect(search).toHaveBeenLastCalledWith('', 0, false, [], 'Anne Brock');
      expect(service.authorsExpanded).toBe(false);
      expectElementToContainContent(fixture, '[data-author-filter]', 'Anne Brock');
      expect(new URLSearchParams(TestBed.inject(Location).path().split('?')[1]).get('author')).toBe('Anne Brock');

      clickElement(fixture, '[data-clear-author]');
      fixture.detectChanges();
      expect(service.searchAuthor).toBe('');
      expect(search).toHaveBeenLastCalledWith('', 0, false, [], '');
    });
  });

  describe('shared note link', () => {
    afterEach(() => {
      window.history.replaceState(null, '', '/');
      TestBed.inject(RecipeService).sharedNote = null;
    });

    it('holds the note for its recipe and drops the param, keeping the recipe path', () => {
      const encoded = encodeSharedNote({ name: 'Grandma', filename: '0042', note: 'Less salt' });
      window.history.replaceState(null, '', `/0042/pie?sharedNote=${encodeURIComponent(encoded)}`);

      fixture.detectChanges();

      expect(TestBed.inject(RecipeService).sharedNote).toEqual({ name: 'Grandma', filename: '0042', note: 'Less salt' });
      expect(TestBed.inject(Location).path()).toBe('/0042/pie');
    });

    it('ignores a malformed note link', () => {
      window.history.replaceState(null, '', '/?sharedNote=garbage');

      fixture.detectChanges();

      expect(TestBed.inject(RecipeService).sharedNote).toBeNull();
    });
  });

  it('should open the about dialog from the info button', () => {
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(undefined!);
    fixture.detectChanges();

    clickElement(fixture, '[data-about-button]');

    expect(open).toHaveBeenCalledWith(AboutDialogComponent, expect.any(Object));
  });

  describe('shared favorites', () => {
    let service: RecipeService;
    const recipe = (filename: string) =>
      ({ ...EMPTY_RECIPE, name: `Recipe ${filename}`, filename }) as Recipe;

    beforeEach(() => {
      service = TestBed.inject(RecipeService);
      vi.spyOn(service, 'isFullyLoaded').mockReturnValue(true);
      vi.spyOn(service, 'findRecipe').mockImplementation((filename: string) => recipe(filename));
    });

    afterEach(() => {
      service.sharedFavorites = null;
    });

    // Recipes resolve through plain promises, so let them settle before rendering again.
    async function render(): Promise<void> {
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }

    it('shows the shared card titled with the sender name', async () => {
      service.sharedFavorites = { name: 'Grandma', favorites: ['0001', '0002'] };
      await render();

      expectElementToContainContent(fixture, '[data-shared-favorites] h3', "Grandma's Favorites");
      expect(component.sharedFavoritesDataSource.data.length).toBe(2);
    });

    it('merges shared favorites and reports how many were new', async () => {
      const merge = vi.spyOn(service, 'mergeSharedFavorites').mockReturnValue(1);
      service.sharedFavorites = { name: '', favorites: ['0001', '0002'] };
      await render();

      clickElement(fixture, '[data-merge-favorites]');
      fixture.detectChanges();

      expect(merge).toHaveBeenCalledWith(['0001', '0002']);
      expectElementToContainContent(fixture, '[data-merge-result]', 'Added 1 recipe to your favorites');
    });

    it('dismisses the shared card', async () => {
      service.sharedFavorites = { name: '', favorites: ['0001'] };
      await render();

      component.dismissSharedFavorites();
      fixture.detectChanges();

      expect(service.sharedFavorites).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-shared-favorites]')).toBeNull();
    });

    it('copies a share link with the name and favorites', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue(' Ryan ');
      const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
      component.favoritesDataSource.data = [recipe('0005'), recipe('0007')];

      component.shareFavorites();

      const url = new URL(write.mock.lastCall![0] as string);
      expect(url.pathname).toBe('/');
      expect(decodeSharedFavorites(url.searchParams.get('sharedFavorites')!)).toEqual({
        name: 'Ryan',
        favorites: ['0005', '0007'],
      });
    });

    it('does not share when the name prompt is cancelled', () => {
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

      component.shareFavorites();

      expect(write).not.toHaveBeenCalled();
    });
  });
});
