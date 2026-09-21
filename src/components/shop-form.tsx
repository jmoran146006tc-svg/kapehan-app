import { useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { shopFormSchema, type ShopFormValues, type ShopFormInput, DAYS, DEFAULT_HOURS } from '@/lib/schemas/shop';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { getUserFriendlyError } from '@/lib/errors';
import { MAX_TAGS_PER_SHOP, TAG_OPTIONS, type ShopTag } from '@/constants/tags';

interface ShopFormProps {
  defaultValues?: Partial<ShopFormValues>;
  onSubmit: (values: ShopFormValues) => Promise<void>;
  submitLabel: string;
}

export function ShopForm({ defaultValues, onSubmit, submitLabel }: ShopFormProps) {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm
  <ShopFormInput,
  any,
  ShopFormValues>({
  resolver: zodResolver(shopFormSchema),
  defaultValues: {
    name: '', address: '', lat: '', lng: '',
    priceMin: 60, priceMax: 150, hasWifi: true, tags: [], description: '',
    hours: DEFAULT_HOURS, photos: [],
    ...defaultValues,
  },
});

  const photos = useWatch({ control, name: 'photos' }) ?? [];
  const tags = useWatch({ control, name: 'tags' }) ?? [];


  async function pickPhoto() {
    setSubmitError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled) return;
      setUploading(true);
      const url = await uploadToCloudinary(result.assets[0].uri);
      setValue('photos', [...photos, url], { shouldValidate: true });
    } catch (error) {
      setSubmitError(getUserFriendlyError(error, 'We could not upload that photo. Please try again.'));
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    setValue('photos', photos.filter((p) => p !== url), { shouldValidate: true });
  }

  async function handleFormSubmit(values: ShopFormValues) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(getUserFriendlyError(error, 'We could not save this listing. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <Controller control={control} name="name" render={({ field }) => (
        <Input placeholder="Shop name" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />
      )} />
      {errors.name && <Text className="text-destructive">{errors.name.message}</Text>}

      <Controller control={control} name="address" render={({ field }) => (
        <Input placeholder="Address" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />
      )} />
      {errors.address && <Text className="text-destructive">{errors.address.message}</Text>}

      <View className="flex-row gap-2">
        <Controller control={control} name="lat" render={({ field }) => (
          <Input className="flex-1" placeholder="Latitude" keyboardType="decimal-pad"
            value={String(field.value ?? '')} onBlur={field.onBlur} onChangeText={field.onChange} />
        )} />
        <Controller control={control} name="lng" render={({ field }) => (
          <Input className="flex-1" placeholder="Longitude" keyboardType="decimal-pad"
            value={String(field.value ?? '')} onBlur={field.onBlur} onChangeText={field.onChange} />
        )} />
      </View>
      <Text className="text-muted-foreground text-xs -mt-2">
        Drop a pin in Google Maps, long-press it, and copy the coordinates it shows.
      </Text>
      {(errors.lat || errors.lng) && <Text className="text-destructive">{errors.lat?.message ?? errors.lng?.message}</Text>}

      <Text className="font-semibold">Typical price range</Text>
      <View className="flex-row gap-2">
        <Controller control={control} name="priceMin" render={({ field }) => (
          <Input className="flex-1" placeholder="Typical price min" keyboardType="numeric"
            value={String(field.value ?? '')} onBlur={field.onBlur} onChangeText={field.onChange} />
        )} />
        <Controller control={control} name="priceMax" render={({ field }) => (
          <Input className="flex-1" placeholder="Typical price max" keyboardType="numeric"
            value={String(field.value ?? '')} onBlur={field.onBlur} onChangeText={field.onChange} />
        )} />
      </View>
      {errors.priceMin && <Text className="text-destructive">{errors.priceMin.message}</Text>}
      {errors.priceMax && <Text className="text-destructive">{errors.priceMax.message}</Text>}

      <Text className="font-semibold">Description</Text>
      <Controller control={control} name="description" render={({ field }) => (
        <Input className="min-h-24 py-3" multiline placeholder="Tell guests what makes your shop special (optional)" maxLength={500} value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />
      )} />
      {errors.description && <Text className="text-destructive">{errors.description.message}</Text>}

      <Text className="font-semibold">WiFi</Text>
      <Controller control={control} name="hasWifi" render={({ field }) => (
        <View className="flex-row gap-2">
          <Button className="flex-1" variant={field.value ? 'default' : 'outline'} onPress={() => field.onChange(true)}>
            <Text>WiFi</Text>
          </Button>
          <Button className="flex-1" variant={!field.value ? 'default' : 'outline'} onPress={() => field.onChange(false)}>
            <Text>No WiFi</Text>
          </Button>
        </View>
      )} />

      <Text className="font-semibold">Tags</Text>
      <View className="flex-row flex-wrap gap-2">
        {TAG_OPTIONS.map((tag) => {
          const selected = tags.includes(tag);
          return (
            <Button key={tag} size="sm" variant={selected ? 'default' : 'outline'}
              onPress={() => {
                const nextTags = selected
                  ? tags.filter((current) => current !== tag)
                  : tags.length < MAX_TAGS_PER_SHOP ? [...tags, tag] : tags;
                setValue('tags', nextTags as ShopTag[], { shouldValidate: true });
              }}>
              <Text>{tag}</Text>
            </Button>
          );
        })}
      </View>
      <Text className="text-muted-foreground text-xs -mt-2">Choose up to {MAX_TAGS_PER_SHOP} tags.</Text>
      {errors.tags && <Text className="text-destructive">{errors.tags.message}</Text>}

      <Text className="font-semibold">Hours</Text>
      {DAYS.map((day) => (
        <Controller key={day} control={control} name={`hours.${day}`} render={({ field }) => (
          <View className="flex-row items-center gap-2">
            <Text className="w-12 capitalize">{day}</Text>
            <Input className="flex-1" placeholder="Open" editable={!field.value.closed}
              value={field.value.open} onBlur={field.onBlur} onChangeText={(t) => field.onChange({ ...field.value, open: t })} />
            <Input className="flex-1" placeholder="Close" editable={!field.value.closed}
              value={field.value.close} onBlur={field.onBlur} onChangeText={(t) => field.onChange({ ...field.value, close: t })} />
            <Button size="sm" variant={field.value.closed ? 'default' : 'outline'}
              onPress={() => field.onChange({ ...field.value, closed: !field.value.closed })}>
              <Text>Closed</Text>
            </Button>
          </View>
        )} />
      ))}
      <Text className="text-muted-foreground text-xs -mt-2">24-hour HH:mm — e.g. 07:00 and 21:00.</Text>
      {errors.hours && <Text className="text-destructive">Check that every open day uses 24-hour time (for example, 07:00).</Text>}

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

      {submitError && <Text accessibilityRole="alert" className="text-destructive">{submitError}</Text>}
      <Button loading={submitting} loadingLabel="Saving…" onPress={handleSubmit(handleFormSubmit)} disabled={uploading}>
        <Text>{submitLabel}</Text>
      </Button>
    </View>
  );
}
