import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getUserFriendlyError } from '@/lib/errors';
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
      setSubmitError(getUserFriendlyError(error, 'We could not upload that photo. Please try again.'));
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
    } catch (error) { setSubmitError(getUserFriendlyError(error, 'We could not save this menu item. Please try again.')); } finally { setSubmitting(false); }
  }

  return <View className="gap-4"><Button variant="secondary" className="h-32 w-32 self-center p-0 items-center justify-center overflow-hidden border border-border bg-secondary" loading={uploading} loadingLabel="Uploading…" onPress={choosePhoto}>{photoUrl ? <Image source={{ uri: photoUrl }} className="h-full w-full" resizeMode="cover" /> : <Text className="text-center text-xs">Tap to add photo</Text>}</Button><Controller control={control} name="name" render={({ field }) => <Input placeholder="Item name" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />} />{errors.name ? <Text className="text-destructive">{errors.name.message}</Text> : null}<Controller control={control} name="price" render={({ field }) => <Input placeholder="Price in pesos" keyboardType="numeric" value={String(field.value ?? '')} onBlur={field.onBlur} onChangeText={field.onChange} />} />{errors.price ? <Text className="text-destructive">{errors.price.message}</Text> : null}<View className="gap-2"><Text className="font-semibold">Category</Text><Controller control={control} name="category" render={({ field }) => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">{PRODUCT_CATEGORIES.map((category) => <FilterChip key={category} label={category} selected={field.value === category} onPress={() => field.onChange(category)} />)}</ScrollView>} /></View><Controller control={control} name="description" render={({ field }) => <Input placeholder="Short description (optional)" value={field.value ?? ''} onBlur={field.onBlur} onChangeText={field.onChange} />} /><Controller control={control} name="available" render={({ field }) => <Button variant={field.value ? 'default' : 'outline'} onPress={() => field.onChange(!field.value)}><Text>{field.value ? 'Available' : 'Unavailable'}</Text></Button>} />{submitError ? <Text accessibilityRole="alert" className="text-destructive">{submitError}</Text> : null}<View className="flex-row gap-2"><Button className="flex-1" variant="outline" onPress={onCancel}><Text>Cancel</Text></Button><Button className="flex-1" loading={submitting} loadingLabel="Saving…" disabled={uploading} onPress={handleSubmit(save)}><Text>{product ? 'Save Item' : 'Add to Menu'}</Text></Button></View></View>;
}
