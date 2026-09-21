import { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types/product';
import type { Shop } from '@/types/shop';
import { PRODUCT_CATEGORIES } from '@/constants/products';
import { OwnerShopShell } from '@/components/owner-shop-shell';
import { ProductEditor } from '@/components/product-editor';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function OwnerMenuScreen() {
  return <OwnerShopShell active="menu">{(shop) => <OwnerMenuContent key={shop.id} shop={shop} />}</OwnerShopShell>;
}

function OwnerMenuContent({ shop }: { shop: Shop }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  useEffect(() => onSnapshot(query(collection(db, 'shops', shop.id, 'products'), orderBy('category'), orderBy('name')), (snapshot) => setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Product))), [shop.id]);
  const editor = adding || editing ? <ProductEditor shopId={shop.id} product={editing ?? undefined} onCancel={() => { setAdding(false); setEditing(null); }} /> : null;
  return <ScrollView className="flex-1 bg-background px-4" contentContainerClassName="gap-4 py-5 pb-8"><View className="flex-row items-center justify-between"><View><Text className="text-xl font-bold">Menu</Text><Text className="text-sm text-muted-foreground">{products.length} popular item{products.length === 1 ? '' : 's'} on menu</Text></View><Button size="sm" className="rounded-full bg-accent" onPress={() => { setEditing(null); setAdding(true); }}><Text>+ Add Item</Text></Button></View>{editor}{PRODUCT_CATEGORIES.map((category) => { const categoryProducts = products.filter((product) => product.category === category); if (!categoryProducts.length) return null; return <View key={category} className="gap-2"><Text className="text-sm font-bold tracking-wider text-muted-foreground">{category.toUpperCase()}</Text>{categoryProducts.map((product) => <Card key={product.id} className="py-3"><CardHeader><View className="flex-row items-center gap-3"><View className="h-12 w-12 overflow-hidden rounded-lg bg-secondary">{product.photoUrl ? <Image source={{ uri: product.photoUrl }} className="h-full w-full" /> : null}</View><Button variant="ghost" className="flex-1 items-start px-0" onPress={() => { setAdding(false); setEditing(product); }}><View><CardTitle>{product.name}</CardTitle>{product.description ? <CardDescription>{product.description}</CardDescription> : null}<Text className="mt-1 font-bold">₱{product.price}</Text></View></Button><Button size="sm" variant="outline" onPress={() => void deleteDoc(doc(db, 'shops', shop.id, 'products', product.id))}><Text>×</Text></Button></View></CardHeader></Card>)}</View>; })}{products.length === 0 && !editor ? <Text className="py-8 text-center text-muted-foreground">Add the first menu item for this shop.</Text> : null}</ScrollView>;
}
