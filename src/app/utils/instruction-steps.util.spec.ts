import { splitSteps } from './instruction-steps.util';

describe('splitSteps', () => {
  it('returns nothing for empty instructions', () => {
    expect(splitSteps('')).toEqual([]);
    expect(splitSteps('   ')).toEqual([]);
    expect(splitSteps(undefined)).toEqual([]);
  });

  it('keeps a single sentence as one step', () => {
    expect(splitSteps('Mix everything together')).toEqual(['Mix everything together']);
  });

  it('splits a paragraph on sentence ends', () => {
    expect(splitSteps('Preheat oven to 350°. Mix well! Is it thick? Bake 30 minutes.')).toEqual([
      'Preheat oven to 350°.',
      'Mix well!',
      'Is it thick?',
      'Bake 30 minutes.',
    ]);
  });

  it('does not split after unit abbreviations', () => {
    expect(splitSteps('Add 1 c. Flour and 2 tsp. Salt. Stir.')).toEqual([
      'Add 1 c. Flour and 2 tsp. Salt.',
      'Stir.',
    ]);
  });

  it('does not split decimals or lowercase continuations', () => {
    expect(splitSteps('Add 1.5 cups milk. Bake in 9 x 13 in. pan.')).toEqual([
      'Add 1.5 cups milk.',
      'Bake in 9 x 13 in. pan.',
    ]);
  });

  it('splits a sentence followed by a number', () => {
    expect(splitSteps('Cool. 2 hours later, slice.')).toEqual(['Cool.', '2 hours later, slice.']);
  });

  it('uses line breaks when the text already has them', () => {
    expect(splitSteps('Mix. Stir.\n\n  Bake.  \n')).toEqual(['Mix. Stir.', 'Bake.']);
  });
});
