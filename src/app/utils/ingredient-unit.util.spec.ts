import { canonicalUnit, ingredientText, splitUnit, unitLabel } from './ingredient-unit.util';

describe('ingredient units', () => {
  describe('canonicalUnit', () => {
    it('resolves spellings to one unit', () => {
      expect(canonicalUnit('c.')).toBe('cup');
      expect(canonicalUnit('Cups')).toBe('cup');
      expect(canonicalUnit('Tbsp.')).toBe('tbsp');
      expect(canonicalUnit('tbl')).toBe('tbsp');
      expect(canonicalUnit('lbs.')).toBe('lb');
      expect(canonicalUnit('sq.')).toBe('square');
    });

    it('tells teaspoons from tablespoons by case', () => {
      expect(canonicalUnit('t.')).toBe('tsp');
      expect(canonicalUnit('T.')).toBe('tbsp');
    });

    it('returns nothing for words that are not units', () => {
      expect(canonicalUnit('eggs')).toBe('');
      expect(canonicalUnit('large')).toBe('');
    });
  });

  describe('splitUnit', () => {
    it('pulls a leading unit off the name', () => {
      expect(splitUnit('c. butter or margarine')).toEqual({ unit: 'cup', name: 'butter or margarine' });
      expect(splitUnit('  tsp.   salt ')).toEqual({ unit: 'tsp', name: 'salt' });
    });

    it('leaves names without a leading unit alone', () => {
      expect(splitUnit('eggs')).toEqual({ unit: '', name: 'eggs' });
      expect(splitUnit('8 oz. can crescent rolls')).toEqual({ unit: '', name: '8 oz. can crescent rolls' });
      expect(splitUnit('c.')).toEqual({ unit: '', name: 'c.' });
    });
  });

  describe('unitLabel', () => {
    it('pluralizes past one', () => {
      expect(unitLabel('cup', 0.5)).toBe('cup');
      expect(unitLabel('cup', 1)).toBe('cup');
      expect(unitLabel('cup', 1.5)).toBe('cups');
      expect(unitLabel('lb', 2)).toBe('lbs');
      expect(unitLabel('box', 2)).toBe('boxes');
    });

    it('keeps abbreviations the same', () => {
      expect(unitLabel('tsp', 3)).toBe('tsp');
      expect(unitLabel('oz', 8)).toBe('oz');
    });

    it('handles missing or unknown units', () => {
      expect(unitLabel(undefined, 2)).toBe('');
      expect(unitLabel('', 2)).toBe('');
      expect(unitLabel('handful', 2)).toBe('handful');
    });
  });

  describe('ingredientText', () => {
    it('puts the unit before the name', () => {
      expect(ingredientText({ unit: 'cup', name: 'flour' }, 2)).toBe('cups flour');
      expect(ingredientText({ name: 'eggs' }, 2)).toBe('eggs');
    });
  });
});
