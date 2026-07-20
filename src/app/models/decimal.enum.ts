interface Fraction {
  numerator: number;
  denominator: number;
}

// Recipe amounts are stored as decimals (0.66, 0.33, 0.125...) so they get
// snapped back onto a real fraction before any batch math happens. Scaling the
// fraction instead of the decimal keeps 0.66 x 3 as "2" rather than "1.98", and
// keeps 0.66 x 2 as "1 1/3" rather than "1 0.32000000000000006".
const DENOMINATORS = [2, 3, 4, 5, 6, 8, 16];

// 1/48 - close enough to catch 0.66 -> 2/3 without swallowing amounts like 1.1
// that were genuinely meant to be decimals.
const TOLERANCE = 0.021;

export function formatAmount(value: any, batch: number = 1): string {
  const amount = value == undefined ? 0 : +value;

  if (!isFinite(amount) || amount === 0) {
    return '';
  }

  const base = Number.isInteger(batch) ? snapToFraction(amount) : undefined;
  const scaled =
    base == undefined
      ? // a fractional batch count can't be applied to the base fraction, so
        // snap the already-multiplied total instead
        snapToFraction(amount * batch)
      : reduce({
          numerator: base.numerator * batch,
          denominator: base.denominator,
        });

  if (scaled == undefined) {
    return trimFloat(amount * batch);
  }

  const whole = Math.floor(scaled.numerator / scaled.denominator);
  const remainder = scaled.numerator % scaled.denominator;

  // the leading whole number is kept even when it is 0 so callers can always
  // split on the space; app-fraction drops a "0" itself
  return remainder === 0
    ? `${whole}`
    : `${whole} ${remainder}/${scaled.denominator}`;
}

export function trimFloat(value: number): string {
  return `${Math.round(value * 10000) / 10000}`;
}

function snapToFraction(value: number): Fraction | undefined {
  let best: Fraction = { numerator: Math.round(value), denominator: 1 };
  let bestError = Math.abs(value - best.numerator);

  DENOMINATORS.forEach((denominator) => {
    const numerator = Math.round(value * denominator);
    const error = Math.abs(value - numerator / denominator);

    if (error < bestError - 1e-9) {
      best = { numerator, denominator };
      bestError = error;
    }
  });

  return bestError <= TOLERANCE ? reduce(best) : undefined;
}

function reduce(fraction: Fraction): Fraction {
  const divisor = greatestCommonDivisor(fraction.numerator, fraction.denominator);

  return {
    numerator: fraction.numerator / divisor,
    denominator: fraction.denominator / divisor,
  };
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? Math.abs(a) || 1 : greatestCommonDivisor(b, a % b);
}
