import {
  pickRandomRecipe,
  RandomPickResult,
  remainingRandomPicks,
} from './random-pick';

describe('pickRandomRecipe', () => {
  const filenames = ['a', 'b', 'c'];

  it('returns undefined for an empty list', () => {
    expect(pickRandomRecipe([], [], null)).toBeUndefined();
  });

  it('only picks recipes not yet picked this cycle', () => {
    const result = pickRandomRecipe(filenames, ['a', 'b'], 'b', () => 0);

    expect(result).toEqual({ filename: 'c', picked: ['a', 'b', 'c'] });
  });

  it('never repeats until every recipe has been picked', () => {
    let picked: string[] = [];
    let current: string | null = null;
    const seen: string[] = [];

    for (let i = 0; i < filenames.length; i++) {
      const result: RandomPickResult = pickRandomRecipe(
        filenames,
        picked,
        current,
      )!;
      picked = result.picked;
      current = result.filename;
      seen.push(result.filename);
    }

    expect([...seen].sort()).toEqual(filenames);
  });

  it('starts a new cycle without repeating the current pick', () => {
    const result = pickRandomRecipe(filenames, ['a', 'b', 'c'], 'c', () => 0.99);

    expect(result!.filename).not.toBe('c');
    expect(result!.picked).toEqual([result!.filename]);
  });

  it('keeps picking the only recipe in a one recipe list', () => {
    const result = pickRandomRecipe(['a'], ['a'], 'a');

    expect(result).toEqual({ filename: 'a', picked: ['a'] });
  });

  it('ignores picked recipes that were removed from the list', () => {
    const result = pickRandomRecipe(['a', 'b'], ['gone', 'a'], 'a', () => 0);

    expect(result).toEqual({ filename: 'b', picked: ['a', 'b'] });
  });
});

describe('remainingRandomPicks', () => {
  it('counts recipes not yet picked', () => {
    expect(remainingRandomPicks(['a', 'b', 'c'], ['a', 'gone'])).toBe(2);
  });
});
