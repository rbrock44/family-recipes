import { RecipeReaderService } from './recipe-reader.service';
import { TestBed } from '@angular/core/testing';
import { RecipeService } from './recipe.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RecipeModel } from '../models/recipe.model';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import type { MockInstance } from 'vitest';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';

describe('RecipeService', () => {
  let service: RecipeService;
  let reader: RecipeReaderService;
  let spy: MockInstance;

  const sampleRecipe = new RecipeModel({
    name: 'Example',
    author: 'Ryan',
    category: 1,
    ingredients: [
      { name: 'a', amount: 1 },
      { name: 'b', amount: 2 },
      { name: 'c', amount: 3 },
    ],
    instructions: 'how to',
    yield: { name: 'b', amount: 12 },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideLocationMocks(),
      ],
    });

    reader = TestBed.inject(RecipeReaderService);
    spy = vi.spyOn(reader, 'readRecipes').mockReturnValue([sampleRecipe]);
    service = TestBed.inject(RecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get recipes on init', () => {
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should merge only new shared favorites', () => {
    vi.spyOn(reader, 'readFavorites').mockReturnValue(['0001']);
    const add = vi.spyOn(reader, 'addToFavorites').mockImplementation(() => {});
    service.favorites = new Set(['0001']);

    const added = service.mergeSharedFavorites(['0001', '0002', '0003']);

    expect(added).toBe(2);
    expect(add.mock.calls).toEqual([['0002'], ['0003']]);
    expect(service.isFavorite('0003')).toBe(true);
  });

  describe('history', () => {
    let location: Location;

    beforeEach(() => {
      location = TestBed.inject(Location);
      vi.spyOn(service, 'readRecipe').mockImplementation(() => {});
    });

    it('should reopen the recipe, then the lists, as the browser goes back', () => {
      service.pushView(service.listsUrl(), { lists: true });
      service.pushView(service.buildRecipeUrl('0042'), { fromLists: true });
      service.pushView(service.buildRecipeUrl(null));

      location.back();
      expect(service.readRecipe).toHaveBeenCalledWith('0042');
      expect(service.openedFromLists).toBe(true);
      expect(service.showLists).toBe(false);

      location.back();
      expect(service.showLists).toBe(true);
      expect(service.openedFromLists).toBe(false);

      location.back();
      expect(service.showLists).toBe(false);
    });

    it('should only step back through entries the app pushed', () => {
      expect(service.canGoBack()).toBe(false);
      service.pushView(service.buildRecipeUrl('0007'));
      expect(service.canGoBack()).toBe(true);
    });

    it('should open cook mode on its own entry so back closes it', () => {
      service.selectRecipe({ ...sampleRecipe, filename: '0042', name: 'Pie' });
      service.pushView(service.buildRecipeUrl('0042'), { fromLists: true });
      service.openedFromLists = true;

      service.openCookMode();
      expect(service.cookMode).toBe(true);
      expect(location.path()).toBe('/0042/pie');

      location.back();
      expect(service.cookMode).toBe(false);
      expect(service.openedFromLists).toBe(true);
      // Same recipe, so it is not fetched again.
      expect(service.readRecipe).not.toHaveBeenCalled();

      location.forward();
      expect(service.cookMode).toBe(true);
    });

    it('should close cook mode by stepping back over its entry', () => {
      service.selectRecipe({ ...sampleRecipe, filename: '0042', name: 'Pie' });
      service.pushView(service.buildRecipeUrl('0042'));
      service.openCookMode();

      service.closeCookMode();

      expect(service.cookMode).toBe(false);
      expect(location.getState()).toEqual({ app: true });
    });

    it('should close cook mode in place when it has no entry of its own', () => {
      service.cookMode = true;

      service.closeCookMode();

      expect(service.cookMode).toBe(false);
    });

    it('should leave cook mode when going home', () => {
      service.cookMode = true;

      service.setEmptyRecipe();

      expect(service.cookMode).toBe(false);
    });

    it('should build recipe paths with the name once known, and home with its search', () => {
      location.replaceState('/?search=pie');
      expect(service.buildRecipeUrl(null)).toBe('/?search=pie');
      expect(service.buildRecipeUrl('0002')).toBe('/0002');

      service.selectRecipe({ ...sampleRecipe, filename: '0002', name: 'Apple Pie' });
      expect(service.buildRecipeUrl('0002')).toBe('/0002/apple-pie');
    });
  });

  describe('restoreSearchParams', () => {
    it('should seed the search, category and family filter from a link', () => {
      service.restoreSearchParams('/?search=pie&category=6&hooperFamily=true');

      expect(service.searchTerm).toBe('pie');
      expect(service.searchCategory).toBe(6);
      expect(service.searchHooperFamily).toBe(true);
    });

    it('should fall back to defaults for missing or bad values', () => {
      service.restoreSearchParams('/?category=99&hooperFamily=yes');

      expect(service.searchTerm).toBe('');
      expect(service.searchCategory).toBe(0);
      expect(service.searchHooperFamily).toBe(false);
    });
  });

  describe('readRecipe', () => {
    let location: Location;

    beforeEach(() => {
      location = TestBed.inject(Location);
      vi.spyOn(reader, 'firstValueFrom').mockReturnValue(
        Promise.resolve(JSON.stringify({ ...sampleRecipe, name: 'Puppy Chow' })),
      );
    });

    it('should fill in the name on a bare or misnamed recipe path, keeping history state', async () => {
      location.go('/0002/wrong-name', '', { app: true });

      service.readRecipe('0002');
      await Promise.resolve();
      await Promise.resolve();

      expect(location.path()).toBe('/0002/puppy-chow');
      expect(service.canGoBack()).toBe(true);
    });

    it('should leave the URL alone once the user has moved on', async () => {
      location.go('/0002');
      service.readRecipe('0002');
      location.go('/');
      await Promise.resolve();
      await Promise.resolve();

      expect(location.path()).toBe('/');
    });
  });
});
