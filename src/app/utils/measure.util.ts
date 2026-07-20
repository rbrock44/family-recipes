/**
 * Formats measurement amounts as mixed fractions for the conversion tables.
 * Kitchen amounts are read as fractions ("1/16 cup"), never as decimals
 * ("0.0625 cup"), so the tables keep exact numbers as their source of truth
 * and split them into a whole part and a fraction part at render time.
 */

/** Fractions a cook actually measures with, smallest first. */
const COMMON_FRACTIONS: ReadonlyArray<readonly [number, string]> = [
  [1 / 16, '1/16'],
  [1 / 8, '1/8'],
  [1 / 6, '1/6'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [3 / 8, '3/8'],
  [1 / 2, '1/2'],
  [5 / 8, '5/8'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
  [5 / 6, '5/6'],
  [7 / 8, '7/8'],
];

/* Half the gap between the two closest entries above (1/16 and 1/8), so a
   remainder can never match two of them. */
const TOLERANCE = 0.02;

function split(value: number): { whole: number; fraction: string } {
  if (!Number.isFinite(value)) {
    return { whole: 0, fraction: '' };
  }

  const whole = Math.floor(value);
  const remainder = value - whole;
  const match = COMMON_FRACTIONS.find(
    ([amount]) => Math.abs(remainder - amount) < TOLERANCE
  );

  return { whole, fraction: match ? match[1] : '' };
}

/** The whole-number part, e.g. '10' for 10 2/3. Empty when there isn't one. */
export function wholePart(value: number): string {
  const { whole, fraction } = split(value);
  return whole === 0 && fraction ? '' : String(whole);
}

/** The fraction part as 'n/d', e.g. '2/3' for 10 2/3. Empty when there isn't one. */
export function fractionPart(value: number): string {
  return split(value).fraction;
}
