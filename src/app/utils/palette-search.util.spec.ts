import { EMPTY_RECIPE } from '../constants/constants';
import { PaletteEntry, searchEntries, toRecipeEntry } from './palette-search.util';

function entry(filename: string, name: string, author = 'Mary Hooper', category = 6): PaletteEntry {
  return toRecipeEntry({ ...EMPTY_RECIPE, filename, name, author, category });
}

describe('searchEntries', () => {
  const entries = [
    entry('0001', 'Grandma Apple Cake'),
    entry('0002', 'Cake Doughnuts'),
    entry('0003', 'Pineapple Upside Down Cake'),
    entry('0004', 'Applesauce Bread', 'Elaine Heuring', 5),
    entry('0005', 'Apple Cake'),
  ];
  const titles = (query: string) => searchEntries(entries, query).map(it => it.title);

  it('should return everything in the given order for an empty query', () => {
    expect(searchEntries(entries, '   ')).toBe(entries);
  });

  it('should require every word to match', () => {
    expect(titles('apple cake')).toEqual(['Apple Cake', 'Grandma Apple Cake', 'Pineapple Upside Down Cake']);
    expect(titles('apple zzz')).toEqual([]);
  });

  it('should rank title prefix, then word start, then anywhere in the title, then other fields', () => {
    expect(titles('apple')).toEqual([
      'Applesauce Bread',
      'Apple Cake',
      'Grandma Apple Cake',
      'Pineapple Upside Down Cake',
    ]);
    expect(titles('cake')).toEqual([
      'Cake Doughnuts',
      'Grandma Apple Cake',
      'Pineapple Upside Down Cake',
      'Apple Cake',
    ]);
  });

  it('should match author, recipe number and category, ignoring case', () => {
    expect(titles('HEURING')).toEqual(['Applesauce Bread']);
    expect(titles('0002')).toEqual(['Cake Doughnuts']);
    expect(titles('breads')).toEqual(['Applesauce Bread']);
  });

  it('should keep the original order within a rank', () => {
    expect(titles('mary')).toEqual([
      'Grandma Apple Cake',
      'Cake Doughnuts',
      'Pineapple Upside Down Cake',
      'Apple Cake',
    ]);
  });
});

describe('toRecipeEntry', () => {
  it('should describe the recipe by author, number and category', () => {
    const recipe = entry('0042', 'Beef Stew', 'Elaine Heuring', 3);

    expect(recipe.detail).toBe('Elaine Heuring · #0042 · Meats & Main Dishes');
    expect(recipe.key).toBe('recipe-0042');
  });
});
