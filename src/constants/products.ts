export const PRODUCT_CATEGORIES = ['Espresso', 'Latte', 'Non-Coffee', 'Pastries & Food', 'Other'] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
