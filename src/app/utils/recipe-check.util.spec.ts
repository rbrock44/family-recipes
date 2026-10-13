import {
  CheckableRecipe,
  checkNumbering,
  checkRecipe,
  checkRecipes,
  findDuplicates,
  findTypos,
} from './recipe-check.util';

function recipe(filename: string, overrides: Partial<CheckableRecipe> = {}): CheckableRecipe {
  return {
    filename,
    name: `Recipe ${filename}`,
    author: 'Anne Brock',
    category: 3,
    instructions: 'Mix and bake.',
    ingredients: [{ amount: 1, unit: 'cup', name: 'flour' }],
    yield: { amount: 4, name: 'servings' },
    ...overrides,
  };
}

const kinds = (issues: { kind: string }[]) => issues.map((it) => it.kind);

describe('checkRecipe', () => {
  it('passes a complete recipe', () => {
    expect(checkRecipe(recipe('0001'))).toEqual([]);
  });

  it('flags missing fields, a bad category and no ingredients', () => {
    const issues = checkRecipe(recipe('0001', { name: ' ', author: '', instructions: '', category: 12, ingredients: [] }));

    expect(issues.map((it) => it.message)).toEqual([
      'no name',
      'no author',
      'no instructions',
      'category 12 is not 1-9',
      'no ingredients',
    ]);
    expect(issues.every((it) => it.filename === '0001')).toBe(true);
  });

  it('flags negative or non-numeric amounts', () => {
    const issues = checkRecipe(
      recipe('0001', {
        ingredients: [
          { amount: -1, name: 'eggs' },
          { amount: 'two' as unknown as number, name: 'eggs' },
          { amount: 0, name: 'salt to taste' },
        ],
      }),
    );

    expect(kinds(issues)).toEqual(['bad-amount', 'bad-amount']);
  });

  it('flags a missing yield', () => {
    expect(kinds(checkRecipe(recipe('0001', { yield: { amount: 0, name: '' } })))).toEqual(['no-yield']);
    expect(kinds(checkRecipe(recipe('0001', { yield: undefined })))).toEqual(['no-yield']);
  });

  it('flags unknown unit-like words but not sizes or can numbers', () => {
    const issues = checkRecipe(
      recipe('0001', {
        ingredients: [
          { amount: 1, name: 'doz. eggs' },
          { amount: 1, name: 'med. onion' },
          { amount: 1, name: 'No. 2 can corn' },
          { amount: 1, unit: 'cup', name: 'flour' },
          { amount: 2, name: 'eggs' },
        ],
      }),
    );

    expect(issues).toEqual([
      {
        kind: 'unknown-unit',
        filename: '0001',
        message: 'ingredient 1 "doz. eggs" starts with "doz.", which looks like a unit but isn\'t a known one',
      },
    ]);
  });
});

describe('checkNumbering', () => {
  it('is quiet for a clean run from 0001', () => {
    expect(checkNumbering(['0002', '0001', '0003'])).toEqual([]);
  });

  it('reports gaps and repeats', () => {
    expect(checkNumbering(['0001', '0004', '0004', '0006']).map((it) => `${it.filename} ${it.message}`)).toEqual([
      '0004 missing 0002-0003 before it',
      '0004 used twice',
      '0006 missing 0005 before it',
    ]);
  });
});

describe('findDuplicates', () => {
  it('matches name and author ignoring case and punctuation', () => {
    const issues = findDuplicates([
      recipe('0001', { name: "Grandma's Pie" }),
      recipe('0002', { name: 'grandmas pie!' }),
      recipe('0003', { name: "Grandma's Pie", author: 'Someone Else' }),
    ]);

    expect(issues).toEqual([{ kind: 'duplicate', filename: '0002', message: 'same name and author as 0001' }]);
  });
});

describe('findTypos', () => {
  // Common words need to show up across plenty of recipes to count as the reference spelling.
  const common = Array.from({ length: 15 }, (_, index) =>
    recipe(String(index + 1).padStart(4, '0'), {
      instructions: 'Refrigerate overnight.',
      ingredients: [
        { amount: 1, name: 'margarine' },
        { amount: 1, name: 'onions' },
      ],
    }),
  );

  it('flags a rare spelling a letter or two off a common word', () => {
    const typos = findTypos([
      ...common,
      recipe('0100', { instructions: 'Refridgerate.', ingredients: [{ amount: 1, name: 'margarin' }] }),
    ]);

    expect(typos).toEqual([
      { word: 'margarin', suggestion: 'margarine', filenames: ['0100'] },
      { word: 'refridgerate', suggestion: 'refrigerate', filenames: ['0100'] },
    ]);
  });

  it('leaves other forms of a word, short words and common words alone', () => {
    const typos = findTypos([
      ...common,
      recipe('0100', { instructions: 'Refrigerated.', ingredients: [{ amount: 1, name: 'onion' }] }),
      recipe('0101', { ingredients: [{ amount: 1, name: 'onoin' }] }),
    ]);

    expect(typos).toEqual([]);
  });
});

describe('checkRecipes', () => {
  it('gathers every check into one report', () => {
    const report = checkRecipes([recipe('0001'), recipe('0003', { yield: undefined })]);

    expect(kinds(report.issues)).toEqual(['numbering', 'no-yield']);
    expect(report.typos).toEqual([]);
  });
});
