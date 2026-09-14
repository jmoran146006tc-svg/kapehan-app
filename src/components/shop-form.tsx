import { useState } from 'react';
import { View, Image, Pressable, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { shopFormSchema, type ShopFormValues, type ShopFormInput, DAYS, DEFAULT_HOURS } from '@/lib/schemas/shop';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';

interface ShopFormProps {
  defaultValues?: Partial<ShopFormValues>;
  onSubmit: (values: ShopFormValues) => Promise<void>;
  submitLabel: string;
}

export function ShopForm({ defaultValues, onSubmit, submitLabel }: ShopFormProps) {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm
  <ShopFormInput,
  any,
  ShopFormValues>({
  resolver: zodResolver(shopFormSchema),
  defaultValues: {
    name: '', address: '', lat: 0, lng: 0,
    priceRange: '₱₱', wifiRating: 'moderate',
    hours: DEFAULT_HOURS, photos: [],
    ...defaultValues,
  },
});

const photos = watch('photos') ?? [];


  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri);
      setValue('photos', [...photos, url]);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    setValue('photos', photos.filter((p) => p !== url));
  }

  async function handleFormSubmit(values: ShopFormValues) {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (e: any) {
      Alert.alert('Something went wrong', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <Controller control={control} name="name" render={({ field }) => (
        <Input placeholder="Shop name" value={field.value} onChangeText={field.onChange} />
      )} />
      {errors.name && <Text className="text-destructive">{errors.name.message}</Text>}

      <Controller control={control} name="address" render={({ field }) => (
        <Input placeholder="Address" value={field.value} onChangeText={field.onChange} />
      )} />
      {errors.address && <Text className="text-destructive">{errors.address.message}</Text>}

      <View className="flex-row gap-2">
        <Controller control={control} name="lat" render={({ field }) => (
          <Input className="flex-1" placeholder="Latitude" keyboardType="decimal-pad"
            value={String(field.value)} onChangeText={field.onChange} />
        )} />
        <Controller control={control} name="lng" render={({ field }) => (
          <Input className="flex-1" placeholder="Longitude" keyboardType="decimal-pad"
            value={String(field.value)} onChangeText={field.onChange} />
        )} />
      </View>
      <Text className="text-muted-foreground text-xs -mt-2">
        Drop a pin in Google Maps, long-press it, and copy the coordinates it shows.
      </Text>

      <Text className="font-semibold">Price range</Text>
      <View className="flex-row gap-2">
        {(['₱', '₱₱', '₱₱₱'] as const).map((p) => (
          <Controller key={p} control={control} name="priceRange" render={({ field }) => (
            <Button variant={field.value === p ? 'default' : 'outline'} className="flex-1" onPress={() => field.onChange(p)}>
              <Text>{p}</Text>
            </Button>
          )} />
        ))}
      </View>

      <Text className="font-semibold">WiFi</Text>
      <View className="flex-row gap-2">
        {(['fast', 'moderate', 'none'] as const).map((w) => (
          <Controller key={w} control={control} name="wifiRating" render={({ field }) => (
            <Button variant={field.value === w ? 'default' : 'outline'} className="flex-1" onPress={() => field.onChange(w)}>
              <Text className="capitalize">{w}</Text>
            </Button>
          )} />
        ))}
      </View>

      <Text className="font-semibold">Hours</Text>
      {DAYS.map((day) => (
        <Controller key={day} control={control} name={`hours.${day}`} render={({ field }) => (
          <View className="flex-row items-center gap-2">
            <Text className="w-12 capitalize">{day}</Text>
            <Input className="flex-1" placeholder="Open" editable={!field.value.closed}
              value={field.value.open} onChangeText={(t) => field.onChange({ ...field.value, open: t })} />
            <Input className="flex-1" placeholder="Close" editable={!field.value.closed}
              value={field.value.close} onChangeText={(t) => field.onChange({ ...field.value, close: t })} />
            <Button size="sm" variant={field.value.closed ? 'default' : 'outline'}
              onPress={() => field.onChange({ ...field.value, closed: !field.value.closed })}>
              <Text>Closed</Text>
            </Button>
          </View>
        )} />
      ))}
      <Text className="text-muted-foreground text-xs -mt-2">24-hour "HH:mm" — e.g. 07:00 and 21:00.</Text>

      <Text className="font-semibold">Photos</Text>
      <View className="flex-row flex-wrap gap-2">
        {photos.map((url) => (
          <View key={url} className="relative">
            <Image source={{ uri: url }} className="w-20 h-20 rounded-md" />
            <Pressable onPress={() => removePhoto(url)} className="absolute -top-2 -right-2 bg-destructive rounded-full p-1">
              <Icon as={X} size={12} className="text-white" />
            </Pressable>
          </View>
        ))}
        <Button variant="outline" onPress={pickPhoto} disabled={uploading}>
          <Text>{uploading ? 'Uploading…' : '+ Add photo'}</Text>
        </Button>
      </View>

      <Button onPress={handleSubmit(handleFormSubmit)} disabled={submitting || uploading}>
        <Text>{submitting ? 'Saving…' : submitLabel}</Text>
      </Button>
    </View>
  );
}
