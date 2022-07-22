export const buildCacheKey = (vehicle: string, key: string) => `${vehicle}:${key}`;

export const toFixedWithoutRounding = (num: number, fractionDigits: number) => {
  if ((num > 0 && num < 0.000001) || (num < 0 && num > -0.000001)) {
    // HACK: below this js starts to turn numbers into exponential form like 1e-7.
    // This gives wrong results so we are just changing the original number to 0 here
    // as we don't need such small numbers anyway.
    num = 0;
  }
  const re = new RegExp('^-?\\d+(?:.\\d{0,' + (fractionDigits || -1) + '})?');
  return Number(num.toString(10).match(re)?.[0]);
};
