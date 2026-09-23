import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, View } from 'react-native';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserFriendlyError } from '@/lib/errors';
import { sortProducts, toProduct, type Product } from '@/types/product';
import type { Shop } from '@/types/shop';
import { PRODUCT_CATEGORIES } from '@/constants/products';
import { OwnerShopShell } from '@/components/owner-shop-shell';
import { ProductEditor } from '@/components/product-editor';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export default function OwnerMenuScreen() {
  return <OwnerShopShell active="menu">{(shop) => <OwnerMenuContent key={shop.id} shop={shop} />}</OwnerShopShell>;
}

function OwnerMenuContent({ shop }: { shop: Shop }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const editorOpen = adding || editing !== null;

  useEffect(() => onSnapshot(
    collection(db, 'shops', shop.id, 'products'),
    (snapshot) => setProducts(sortProducts(snapshot.docs.map((item) => toProduct(item.id, item.data())))),
    (error) => setActionError(getUserFriendlyError(error, 'We could not load this menu. Please try again.')),
  ), [shop.id]);

  function closeEditor() {
    setAdding(false);
    setEditing(null);
  }

  async function removeProduct(product: Product) {
    setActionError(null);
    try {
      await deleteDoc(doc(db, 'shops', shop.id, 'products', product.id));
    } catch (error) {
      setActionError(getUserFriendlyError(error, 'We could not remove this menu item. Please try again.'));
    }
  }

  return <>
    <ScrollView className="flex-1 bg-background px-4" contentContainerClassName="mx-auto w-full max-w-2xl gap-4 py-5 pb-8">
      <View className="flex-row items-center justify-between"><View><Text className="text-xl font-bold">Menu</Text><Text className="text-sm text-muted-foreground">{products.length} popular item{products.length === 1 ? '' : 's'} on menu</Text></View><Button size="sm" className="rounded-full bg-accent" onPress={() => { setEditing(null); setAdding(true); }}><Text>Add Item</Text></Button></View>
      {actionError ? <Text accessibilityRole="alert" className="text-destructive">{actionError}</Text> : null}
      {PRODUCT_CATEGORIES.map((category) => { const categoryProducts = products.filter((product) => product.category === category); if (!categoryProducts.length) return null; return <View key={category} className="gap-2"><Text className="text-sm font-bold tracking-wider text-muted-foreground">{category.toUpperCase()}</Text>{categoryProducts.map((product) => <Card key={product.id} className="py-3"><CardHeader><View className="flex-row items-center gap-3"><View className="h-12 w-12 overflow-hidden rounded-lg bg-secondary">{product.photoUrl ? <Image source={{ uri: product.photoUrl }} className="h-full w-full" /> : null}</View><Button variant="ghost" className={cn('flex-1 min-w-0 items-start px-0', Platform.select({ web: 'hover:bg-secondary/60 active:bg-secondary/70' }))} onPress={() => { setAdding(false); setEditing(product); }}><View className="flex-1 min-w-0"><CardTitle numberOfLines={1} ellipsizeMode="tail">{product.name}</CardTitle>{product.description ? <CardDescription numberOfLines={2} ellipsizeMode="tail">{product.description}</CardDescription> : null}<Text numberOfLines={1} ellipsizeMode="tail" className="mt-1 font-bold">₱{product.price.toLocaleString()}</Text></View></Button><Button size="sm" variant="outline" onPress={() => void removeProduct(product)}><Text>Remove</Text></Button></View></CardHeader></Card>)}</View>; })}
      {products.length === 0 ? <Text className="py-8 text-center text-muted-foreground">Add the first menu item for this shop.</Text> : null}
    </ScrollView>
    <Dialog open={editorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}>
      <DialogContent className="max-h-[90%] max-w-xl p-0">
        <ScrollView className="w-full" contentContainerClassName="gap-4 p-6">
          <DialogHeader><DialogTitle>{editing ? 'Edit Menu Item' : 'New Menu Item'}</DialogTitle></DialogHeader>
          <ProductEditor shopId={shop.id} product={editing ?? undefined} onCancel={closeEditor} />
        </ScrollView>
      </DialogContent>
    </Dialog>
  </>;
}
