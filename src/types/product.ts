import type { Timestamp } from 'firebase/firestore';
import type { ProductCategory } from '@/constants/products';

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
