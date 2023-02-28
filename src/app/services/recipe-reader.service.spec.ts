import {RecipeReaderService} from './recipe-reader.service';
import {TestBed} from '@angular/core/testing';
import {RecipeService} from './recipe.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {HttpClient} from '@angular/common/http';
import {RecipeModel} from '../models/recipe.model';

describe('RecipeReaderService', () => {
  let reader: RecipeReaderService;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });

    http = TestBed.inject(HttpClient);
    reader = TestBed.inject(RecipeReaderService);
  });

  it('should be created', () => {
    expect(reader).toBeTruthy();
  });

  it('should create filenames by total number', () => {
    const expected = [
      '0001',
      '0002',
      '0003',
      '0004',
      '0005',
      '0006',
      '0007',
      '0008',
      '0009',
      '0010',
    ];

    const result = reader.createFilenames(10);
    expect(result).toEqual(expected);
  });

  it('should create filenames by total number round 2', () => {
    const expected = [
      '0001',
      '0002',
      '0003',
      '0004',
      '0005',
    ];

    const result = reader.createFilenames(5);
    expect(result).toEqual(expected);
  });

  it('should parse recipe from json', () => {
    const text = getJSON();

    const expected = new RecipeModel({
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
    const result = reader.convertRecipe(text.trim());
    expect(new RecipeModel(result)).toEqual(expected);
  });

  function getJSON(): string {
    return `
    {
  "name": "Example",
  "author": "Ryan",
  "category": 1,
  "ingredients": [
    {
      "name": "a",
      "amount": 1
    },
    {
      "name": "b",
      "amount": 2
    },
    {
      "name": "c",
      "amount": 3
    }
  ],
  "instructions": "how to",
  "yield": {
    "name": "b",
    "amount": 12
  }
}
    `.trim()
  }
});
