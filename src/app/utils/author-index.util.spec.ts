import { RecipeModel } from '../models/recipe.model';
import { filterAuthors, indexAuthors } from './author-index.util';

const byAuthor = (...authors: string[]) => authors.map((author) => new RecipeModel({ author }));

describe('indexAuthors', () => {
  it('counts recipes per author, most first, then by name', () => {
    const result = indexAuthors(byAuthor('Joan Drury', 'Anne Brock', 'Zed', 'Anne Brock', 'Amy'));

    expect(result.map((it) => [it.author, it.count])).toEqual([
      ['Anne Brock', 2],
      ['Amy', 1],
      ['Joan Drury', 1],
      ['Zed', 1],
    ]);
  });

  it('marks Hooper family authors', () => {
    const result = indexAuthors(byAuthor('Charlotte Hooper', 'Anne Brock'));

    expect(result.find((it) => it.author === 'Charlotte Hooper')?.family).toBe(true);
    expect(result.find((it) => it.author === 'Anne Brock')?.family).toBe(false);
  });

  it('trims names and skips blank authors', () => {
    const result = indexAuthors(byAuthor(' Amy ', 'Amy', '', '  '));

    expect(result).toEqual([{ author: 'Amy', count: 2, family: false }]);
  });
});

describe('filterAuthors', () => {
  const entries = indexAuthors(byAuthor('Anne Brock', 'Ryan Hooper Brock', 'Charlotte Hooper'));

  it('keeps authors containing every word, in any order', () => {
    expect(filterAuthors(entries, 'brock').map((it) => it.author)).toEqual(['Anne Brock', 'Ryan Hooper Brock']);
    expect(filterAuthors(entries, 'HOOPER ryan').map((it) => it.author)).toEqual(['Ryan Hooper Brock']);
  });

  it('keeps everyone for a blank query', () => {
    expect(filterAuthors(entries, '  ').length).toBe(3);
  });
});
