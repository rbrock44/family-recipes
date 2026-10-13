import { RecipeModel } from '../models/recipe.model';
import { authorPeople, filterAuthors, indexAuthors, matchesAuthor } from './author-index.util';

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

  it('counts each person a recipe credits, once per recipe', () => {
    const result = indexAuthors(
      byAuthor('Anne Brock', 'Mrs. Coats - Anne Brock', 'Anne Brockman', 'Helen Menz, Donna Menz', 'Donna Menz'),
    );

    expect(result.map((it) => [it.author, it.count])).toEqual([
      ['Anne Brock', 2],
      ['Donna Menz', 2],
      ['Anne Brockman', 1],
      ['Helen Menz', 1],
      ['Mrs. Coats', 1],
    ]);
  });

  it('merges spellings into one chip, shown the way it is written most', () => {
    const result = indexAuthors(byAuthor('Ryan Brock', 'Ryan Hooper Brock', 'Guess who?', 'Guess who?', 'Guess Who?'));

    expect(result).toEqual([
      { author: 'Guess who?', count: 3, family: false },
      { author: 'Ryan Brock', count: 2, family: true },
    ]);
  });

  it('leaves brands and websites out', () => {
    const result = indexAuthors(byAuthor('Kraft - Anne Brock', 'PF Chang', 'plainchicken.com'));

    expect(result.map((it) => it.author)).toEqual(['Anne Brock']);
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

describe('authorPeople', () => {
  it.each([
    ['Anne Brock', ['Anne Brock']],
    ['Mrs. Coats - Anne Brock', ['Mrs. Coats', 'Anne Brock']],
    ['Helen Menz and Donna Menz', ['Helen Menz', 'Donna Menz']],
    ['Lois and Lynna Drury', ['Lois and Lynna Drury']],
    ['Kathy Casteel from Ann Dickerson - Anne Brock', ['Kathy Casteel', 'Ann Dickerson', 'Anne Brock']],
    ['In Memory of Aunt Mary Welter', ['Mary Welter']],
    ['Hazel Luebbers, Grandmother of Joan Drury', ['Hazel Luebbers']],
    ['Charlotte Hooper (Submitted by: Alivia Collier)', ['Charlotte Hooper', 'Alivia Collier']],
    ['Mrs. William (Pat) Schlosser', ['Pat Schlosser']],
    ['Mrs. Theon L. Schlosser, Jr.', ['Mrs. Theon L. Schlosser Jr.']],
    ['Holly Nilsson - spendwithpennies.com', ['Holly Nilsson']],
    ['plainchicken.com', ['plainchicken.com']],
    ['Mature Living, January 2014 - Anne Brock', ['Anne Brock']],
    ['Denise Pepin Chicago, IL', ['Denise Pepin']],
    ['Ryan Hooper Brock', ['Ryan Brock']],
    ['Kraft - Anne Brock', ['Anne Brock']],
    ['PF Chang', ['PF Chang']],
    ['  ', []],
  ])('splits %j', (credit, people) => {
    expect(authorPeople(credit)).toEqual(people);
  });
});

describe('matchesAuthor', () => {
  it('matches a person anywhere in the credit, under any spelling', () => {
    expect(matchesAuthor('Mrs. Coats - Anne Brock', 'anne brock')).toBe(true);
    expect(matchesAuthor('Anne Brockman', 'Anne Brock')).toBe(false);
    expect(matchesAuthor('Ryan Hooper Brock', 'Ryan Brock')).toBe(true);
    expect(matchesAuthor('S.M.P', 'S.M.P.')).toBe(true);
  });
});

describe('filterAuthors', () => {
  const entries = indexAuthors(byAuthor('Anne Brock', 'Ryan Hooper Brock', 'Charlotte Hooper'));

  it('keeps authors containing every word, in any order', () => {
    expect(filterAuthors(entries, 'brock').map((it) => it.author)).toEqual(['Anne Brock', 'Ryan Brock']);
    expect(filterAuthors(entries, 'BROCK ryan').map((it) => it.author)).toEqual(['Ryan Brock']);
  });

  it('keeps everyone for a blank query', () => {
    expect(filterAuthors(entries, '  ').length).toBe(3);
  });
});
