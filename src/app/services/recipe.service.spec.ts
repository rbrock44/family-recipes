import {RecipeReaderService} from './recipe-reader.service';
import {TestBed} from '@angular/core/testing';
import {RecipeService} from './recipe.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {RecipeModel} from '../models/recipe.model';
import Spy = jasmine.Spy;

describe('RecipeService', () => {
  let service: RecipeService;
  let reader: RecipeReaderService;
  let spy: Spy;

  const sampleRecipe = new RecipeModel({
    name: 'Example',
    author: 'Ryan',
    category: 1,
    ingredients: [
      {name: 'a', amount: 1},
      {name: 'b', amount: 2},
      {name: 'c', amount: 3}
    ],
    instructions: 'how to',
    yield: {name: 'b', amount: 12}
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });

    reader = TestBed.inject(RecipeReaderService);
    spy = spyOn(reader, 'readRecipes').and.returnValue([sampleRecipe])
    service = TestBed.inject(RecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get recipes on init', () => {
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
