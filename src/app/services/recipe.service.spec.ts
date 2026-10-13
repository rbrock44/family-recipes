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
      expect(service.searchHave).toBe('');
    });

    it('should seed the ingredients on hand', () => {
      service.restoreSearchParams('/?have=chicken%2C%20rice');

      expect(service.searchHave).toBe('chicken, rice');
    });

    it('should seed the author', () => {
      service.restoreSearchParams('/?author=Anne%20Brock');

      expect(service.searchAuthors).toEqual(['Anne Brock']);
    });

    it('should seed every author', () => {
      service.restoreSearchParams('/?author=Anne%20Brock&author=Charlotte%20Hooper');

      expect(service.searchAuthors).toEqual(['Anne Brock', 'Charlotte Hooper']);
    });

    it('should seed the people in a credit, under one spelling each', () => {
      service.restoreSearchParams('/?author=Mrs.%20Coats%20-%20Anne%20Brock&author=Ryan%20Hooper%20Brock&author=anne%20brock');

      expect(service.searchAuthors).toEqual(['Mrs. Coats', 'Anne Brock', 'Ryan Brock']);
    });
  });

  describe('browse by author', () => {
    beforeEach(() => {
      spy.mockReturnValue([
        new RecipeModel({ filename: '0001', name: 'Pie', author: 'Anne Brock' }),
        new RecipeModel({ filename: '0002', name: 'Cake', author: 'Anne Brockman' }),
        new RecipeModel({ filename: '0003', name: 'Stew', author: 'Anne Brock ' }),
      ]);
      service.load();
    });

    it('should keep that author, not one whose name only starts the same', () => {
      expect(service.search('', 0, false, [], ['Anne Brock']).map(it => it.filename)).toEqual(['0001', '0003']);
    });

    it('should keep recipes the author passed on from a source', () => {
      spy.mockReturnValue([
        new RecipeModel({ filename: '0001', name: 'Pie', author: 'Anne Brock' }),
        new RecipeModel({ filename: '0002', name: 'Cake', author: 'Mrs. Coats - Anne Brock' }),
      ]);
      service.load();

      expect(service.search('', 0, false, [], ['Anne Brock']).map(it => it.filename)).toEqual(['0001', '0002']);
    });

    it('should keep every author picked', () => {
      expect(service.search('', 0, false, [], ['Anne Brock', 'Anne Brockman']).map(it => it.filename)).toEqual([
        '0001',
        '0002',
        '0003',
      ]);
    });

    it('should start a fresh search for the author', () => {
      service.searchTerm = 'pie';
      service.searchCategory = 6;
      service.searchHooperFamily = true;
      service.searchHave = 'rice';

      service.browseAuthor('Anne Brock');

      expect(service.searchTerm).toBe('');
      expect(service.searchCategory).toBe(0);
      expect(service.searchHooperFamily).toBe(false);
      expect(service.searchHave).toBe('');
      expect(service.searchAuthors).toEqual(['Anne Brock']);
      expect(service.hasSearched).toBe(true);
    });
  });

  describe('search by ingredients on hand', () => {
    const ingredientRecipe = (filename: string, name: string, ingredients: string[]) =>
      new RecipeModel({
        filename,
        name,
        author: 'A',
        category: 3,
        ingredients: ingredients.map(it => ({ name: it, amount: 1 })),
      });

    beforeEach(() => {
      spy.mockReturnValue([
        ingredientRecipe('0001', 'Casserole', ['chicken', 'rice', 'soup', 'cheese']),
        ingredientRecipe('0002', 'Fried Rice', ['rice', 'chicken', 'eggs']),
        ingredientRecipe('0003', 'Pudding', ['rice', 'milk']),
      ]);
      service.load();
    });

    it('should keep recipes with every ingredient, closest fit first', () => {
      const result = service.search('', 0, false, ['chicken', 'rice']);

      expect(result.map(it => it.filename)).toEqual(['0002', '0001']);
      expect(service.extraIngredients('0002')).toBe(1);
      expect(service.extraIngredients('0001')).toBe(2);
      expect(service.extraIngredients('0003')).toBeUndefined();
    });

    it('should still combine with the text search', () => {
      expect(service.search('casserole', 0, false, ['rice']).map(it => it.filename)).toEqual(['0001']);
    });

    it('should drop the ranking once the ingredients are cleared', () => {
      service.search('', 0, false, ['rice']);
      const result = service.search('', 0, false, []);

      expect(result.map(it => it.filename)).toEqual(['0001', '0002', '0003']);
      expect(service.extraIngredients('0001')).toBeUndefined();
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
