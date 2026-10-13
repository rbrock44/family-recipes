import { RecipeReaderService } from './recipe-reader.service';
import { TestBed } from '@angular/core/testing';
import { RecipeService } from './recipe.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { RecipeModel } from '../models/recipe.model';

describe('RecipeReaderService', () => {
  let reader: RecipeReaderService;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    reader = TestBed.inject(RecipeReaderService);
  });

  it('should be created', () => {
    expect(reader).toBeTruthy();
  });

  it('should fall back when stored values are corrupt', () => {
    vi.spyOn(localStorage, 'getItem').mockReturnValue('{not json');

    expect(reader.readFavorites()).toEqual([]);
    expect(reader.readLists()).toEqual([]);
    expect(reader.readCheckedIngredients('list')).toEqual([]);
  });

  it('should not throw when storage is unavailable', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });

    expect(() => reader.addToFavorites('0001')).not.toThrow();
    expect(reader.readRecent()).toEqual([]);
  });

  it('should save notes per recipe and drop blank ones', () => {
    localStorage.removeItem(reader.NOTES_NAME);
    reader.setNote('0001', 'Less salt');
    reader.setNote('0002', 'Bake longer');

    expect(reader.readNote('0001')).toBe('Less salt');
    expect(reader.readNote('0003')).toBe('');

    reader.setNote('0001', '   ');
    expect(reader.readNote('0001')).toBe('');
    expect(Object.keys(JSON.parse(localStorage.getItem(reader.NOTES_NAME)!))).toEqual(['0002']);
    localStorage.removeItem(reader.NOTES_NAME);
  });

  it('should save, read and clear cook progress per recipe', () => {
    localStorage.removeItem(reader.COOK_PROGRESS_NAME);
    reader.setCookProgress('0001', { ingredients: [1], steps: [0], current: 1 });
    reader.setCookProgress('0002', { ingredients: [], steps: [], current: 0 });

    expect(reader.readCookProgress('0001')).toEqual({ ingredients: [1], steps: [0], current: 1 });

    reader.setCookProgress('0001', null);
    expect(reader.readCookProgress('0001')).toBeUndefined();
    expect(reader.readCookProgress('0002')).toBeDefined();
    localStorage.removeItem(reader.COOK_PROGRESS_NAME);
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
    const expected = ['0001', '0002', '0003', '0004', '0005'];

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
        { name: 'a', amount: 1 },
        { name: 'b', amount: 2 },
        { name: 'c', amount: 3 },
      ],
      instructions: 'how to',
      yield: { name: 'b', amount: 12 },
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
    `.trim();
  }
});
