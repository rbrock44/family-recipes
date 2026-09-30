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
import Spy = jasmine.Spy;
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';

describe('RecipeService', () => {
  let service: RecipeService;
  let reader: RecipeReaderService;
  let spy: Spy;

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
    spy = spyOn(reader, 'readRecipes').and.returnValue([sampleRecipe]);
    service = TestBed.inject(RecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get recipes on init', () => {
    expect(spy).toHaveBeenCalledTimes(1);
  });

  describe('history', () => {
    let location: Location;

    beforeEach(() => {
      location = TestBed.inject(Location);
      spyOn(service, 'readRecipe');
    });

    it('should reopen the recipe, then the lists, as the browser goes back', () => {
      service.pushView(service.buildRecipeUrl(null), { lists: true });
      service.pushView(service.buildRecipeUrl('042'), { fromLists: true });
      service.pushView(service.buildRecipeUrl(null));

      location.back();
      expect(service.readRecipe).toHaveBeenCalledWith('042');
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
      service.pushView(service.buildRecipeUrl('007'));
      expect(service.canGoBack()).toBe(true);
    });

    it('should set and clear the recipe param while keeping the search', () => {
      location.replaceState('/?search=pie&recipe=001');
      expect(service.buildRecipeUrl(null)).toContain('search=pie');
      expect(service.buildRecipeUrl(null)).not.toContain('recipe=');
      expect(service.buildRecipeUrl('002')).toContain('recipe=002');
    });
  });
});
