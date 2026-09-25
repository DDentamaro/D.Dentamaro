/** Fiches e punti: sempre interi bigint, mai Number/float (§6.2). */
export type Chips = bigint;

export const minChips = (a: Chips, b: Chips): Chips => (a < b ? a : b);
export const maxChips = (a: Chips, b: Chips): Chips => (a > b ? a : b);
export const sumChips = (values: Iterable<Chips>): Chips => {
  let total = 0n;
  for (const v of values) total += v;
  return total;
};
