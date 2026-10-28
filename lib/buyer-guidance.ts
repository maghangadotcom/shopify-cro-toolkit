/** Fictional coffee arithmetic, not a brewing or product-quality claim. */
export function cupEstimate(priceCents: number, grams: number, dose: number) {
  if (![priceCents, grams, dose].every(Number.isSafeInteger) || priceCents < 0 || grams < 1 || dose < 1 || dose > grams)
    throw new Error("Use a nonnegative integer price and a whole-gram dose within the bag weight.");
  const cups = Math.floor(grams / dose);
  return { cups, centsPerCup: Math.ceil(priceCents / cups), leftoverGrams: grams % dose };
}

export const BAG_GRAMS: Readonly<Record<string, number>> = {
  "daybreak-250": 250,
  "daybreak-500": 500,
  "daybreak-1000": 1000,
};
