/** Fictional products and inventory. Prices are USD integer cents. */
export interface ProductVariant {
  id: string;
  title: string;
  weight: string;
  priceCents: number;
  stock: number;
}

export const VARIANTS: readonly ProductVariant[] = [
  {
    id: "daybreak-250",
    title: "Daybreak",
    weight: "250 g",
    priceCents: 2400,
    stock: 8,
  },
  {
    id: "daybreak-500",
    title: "Daybreak",
    weight: "500 g",
    priceCents: 4200,
    stock: 5,
  },
  {
    id: "daybreak-1000",
    title: "Daybreak",
    weight: "1 kg",
    priceCents: 7600,
    stock: 0,
  },
];

export const UPSELL: ProductVariant = {
  id: "measuring-scoop",
  title: "Measuring scoop",
  weight: "Stainless steel",
  priceCents: 800,
  stock: 10,
};

export const CURRENCY = "USD";
export const SUBSCRIPTION_DISCOUNT_PERCENT = 15;
export const SHIPPING_THRESHOLD_CENTS = 6000;
export const SHIPPING_CENTS = 500;
export const FREQUENCIES = [2, 4, 6] as const;
