export enum Decimal {
  '*0.0625' = '1/16',
  '*0.125' = '1/8',
  '*0.2' = '1/5',
  '*0.25' = '1/4',
  '*0.33' = '1/3',
  '*0.375' = '3/8',
  '*0.4' = '2/5',
  '*0.5' = '1/2',
  '*0.625' = '5/8',
  '*0.659' = '2/3',
  '*0.66' = '2/3',
  '*0.75' = '3/4',
  '*0.8' = '4/5',
  '*0.875' = '7/8',
  '*0.6' = '3/5',
}

export function getDecimal(decimal: number): string {
  const dec = `*${decimal.toString()}`;
  const keys = Object.keys(Decimal)
  const value = keys.filter(
    x => {
      if (dec.length == 4) {
        //short decimal -> must mach because 0.625 contains 0.6
        return dec == x
      } else {
        // number is longer
        return x.indexOf(dec) > -1
      }
    }
  )

  return Decimal[value[0] as keyof typeof Decimal] || decimal.toString()
}
