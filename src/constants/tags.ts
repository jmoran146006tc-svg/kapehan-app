export const TAG_OPTIONS = [
  'Quiet', 'Study-Friendly', 'Airconditioned', 'Open 24/7', 'Outdoor Seating',
  'Vegan Options', 'Power Outlets', 'Group-Friendly',
] as const;

export const MAX_TAGS_PER_SHOP = 6;

export type ShopTag = typeof TAG_OPTIONS[number];
