import type { Timestamp } from 'firebase/firestore';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/constants/products';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  photoUrl?: string;
  available: boolean;
  createdAt: Timestamp | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function toProduct(id: string, data: unknown): Product {
  const source = asRecord(data);
  const category = source.category;

  return {
    id,
    name: typeof source.name === 'string' ? source.name : 'Untitled item',
    description: typeof source.description === 'string' ? source.description : undefined,
    price: typeof source.price === 'number' && Number.isFinite(source.price) ? source.price : 0,
    category: PRODUCT_CATEGORIES.includes(category as ProductCategory) ? category as ProductCategory : 'Other',
    photoUrl: typeof source.photoUrl === 'string' ? source.photoUrl : undefined,
    available: source.available !== false,
    createdAt: (source.createdAt as Timestamp | null | undefined) ?? null,
  };
}

export function sortProducts(products: Product[]) {
  return [...products].sort((left, right) =>
    left.category.localeCompare(right.category) || left.name.localeCompare(right.name),
  );
}
