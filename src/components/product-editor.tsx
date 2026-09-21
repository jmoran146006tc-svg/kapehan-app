import { useState } from 'react';
import { Image, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { productFormSchema, type ProductFormInput, type ProductFormValues } from '@/lib/schemas/product';
import type { Product } from '@/types/product';
import { PRODUCT_CATEGORIES } from '@/constants/products';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/filter-chip';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface ProductEditorProps {
  shopId: string;
  product?: Product;
  onCancel: () => void;
}

export function ProductEditor({ shopId, product, onCancel }: ProductEditorProps) {
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ProductFormInput, any, ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: { name: product?.name ?? '', description: product?.description ?? '', price: product?.price ?? '', category: product?.category ?? PRODUCT_CATEGORIES[0], photoUrl: product?.photoUrl ?? '', available: product?.available ?? true } });
  const photoUrl = useWatch({ control, name: 'photoUrl' });

  async function choosePhoto() {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled) setValue('photoUrl', await uploadToCloudinary(result.assets[0].uri), { shouldValidate: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'We could not upload that photo.');
    } finally { setUploading(false); }
  }

  async function save(values: ProductFormValues) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = { name: values.name, ...(values.description ? { description: values.description } : {}), price: values.price, category: values.category, ...(values.photoUrl ? { photoUrl: values.photoUrl } : {}), available: values.available, createdAt: serverTimestamp() };
      if (product) await setDoc(doc(db, 'shops', shopId, 'products', product.id), payload);
      else await addDoc(collection(db, 'shops', shopId, 'products'), payload);
      onCancel();
    } catch (error) { setSubmitError(error instanceof Error ? error.message : 'We could not save this menu item.'); } finally { setSubmitting(false); }
  }

  return <View className="gap-3 rounded-xl border-2 border-accent bg-card p-4"><Text className="text-lg font-bold">{product ? 'Edit Menu Item' : 'New Menu Item'}</Text><Button variant="secondary" className="h-24 w-24 items-center justify-center overflow-hidden border border-border bg-secondary" loading={uploading} loadingLabel="Uploading…" onPress={choosePhoto}>{photoUrl ? <Image source={{ uri: photoUrl }} className="h-full w-full" /> : <Text className="text-center text-xs">Tap to add photo</Text>}</Button><Controller control={control} name="name" render={({ field }) => <Input placeholder="Item name" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />} />{errors.name ? <Text className="text-destructive">{errors.name.message}</Text> : null}<View className="flex-row gap-2"><Controller control={control} name="price" render={({ field }) => <Input className="flex-1" placeholder="₱ Price" keyboardType="numeric" value={String(field.value ?? '')} onBlur={field.onBlur} onChangeText={field.onChange} />} /><Controller control={control} name="category" render={({ field }) => <View className="flex-1 flex-row flex-wrap gap-1">{PRODUCT_CATEGORIES.map((category) => <FilterChip key={category} label={category} selected={field.value === category} onPress={() => field.onChange(category)} />)}</View>} /></View>{errors.price ? <Text className="text-destructive">{errors.price.message}</Text> : null}<Controller control={control} name="description" render={({ field }) => <Input placeholder="Short description (optional)" value={field.value ?? ''} onBlur={field.onBlur} onChangeText={field.onChange} />} /><Controller control={control} name="available" render={({ field }) => <Button variant={field.value ? 'default' : 'outline'} onPress={() => field.onChange(!field.value)}><Text>{field.value ? 'Available' : 'Unavailable'}</Text></Button>} />{submitError ? <Text accessibilityRole="alert" className="text-destructive">{submitError}</Text> : null}<View className="flex-row gap-2"><Button className="flex-1" variant="outline" onPress={onCancel}><Text>Cancel</Text></Button><Button className="flex-1" loading={submitting} loadingLabel="Saving…" disabled={uploading} onPress={handleSubmit(save)}><Text>{product ? 'Save Item' : 'Add to Menu'}</Text></Button></View></View>;
}
