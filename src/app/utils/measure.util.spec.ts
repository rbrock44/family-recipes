import { fractionPart, wholePart } from './measure.util';

describe('measure util', () => {
  it('splits a mixed number into whole and fraction parts', () => {
    expect(wholePart(10 + 2 / 3)).toBe('10');
    expect(fractionPart(10 + 2 / 3)).toBe('2/3');
  });

  it('leaves the whole part empty for a bare fraction', () => {
    expect(wholePart(0.5)).toBe('');
    expect(fractionPart(0.5)).toBe('1/2');
  });

  it('has no fraction part for whole numbers', () => {
    expect(wholePart(3)).toBe('3');
    expect(fractionPart(3)).toBe('');
    expect(wholePart(0)).toBe('0');
  });

  it('matches the smallest fractions without confusing them', () => {
    expect(fractionPart(1 / 16)).toBe('1/16');
    expect(fractionPart(1 / 8)).toBe('1/8');
    expect(fractionPart(2 + 1 / 6)).toBe('1/6');
  });

  it('snaps a remainder within tolerance and drops one that is not', () => {
    expect(fractionPart(0.33)).toBe('1/3');
    expect(fractionPart(0.45)).toBe('');
  });

  it('treats non-finite values as zero', () => {
    expect(wholePart(NaN)).toBe('0');
    expect(fractionPart(Infinity)).toBe('');
  });
});
