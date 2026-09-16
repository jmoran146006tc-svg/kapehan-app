import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { preferencesSchema, type PreferencesValues } from '@/lib/schemas/preferences';
import { PRICE_BUCKET_LABELS, type PriceBucket } from '@/utils/price';
import { getUserFriendlyError } from '@/lib/errors';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { control, handleSubmit, reset } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { wifiRating: [], priceBuckets: [], openNowOnly: false },
  });

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setLoadError(null);
        const preferences = snap.data()?.preferences as Partial<PreferencesValues> | undefined;
        reset({
          wifiRating: preferences?.wifiRating ?? [],
          priceBuckets: preferences?.priceBuckets ?? [],
          openNowOnly: preferences?.openNowOnly ?? false,
        });
      },
      (error) => setLoadError(getUserFriendlyError(error, 'We could not load your preferences. Please try again.')),
    );
  }, [reset, user]);

  async function savePreferences(values: PreferencesValues) {
    if (!user) {
      setSaveError('Log in to save preferences.');
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { preferences: values });
    } catch (error) {
      setSaveError(getUserFriendlyError(error, 'We could not save your preferences. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      // Do not leave navigation waiting on a separate auth subscription to redirect.
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Could not log out', error.message ?? 'Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <Text className="text-2xl font-bold">Profile</Text>
      <Text className="font-semibold">Search preferences</Text>
      {loadError && <Text accessibilityRole="alert" className="text-destructive">{loadError}</Text>}

      <Controller control={control} name="wifiRating" render={({ field }) => (
        <View className="gap-2">
          <Text>Preferred WiFi</Text>
          <View className="flex-row gap-2">
            {(['fast', 'moderate', 'none'] as const).map((wifi) => (
              <Button key={wifi} className="flex-1" size="sm" variant={field.value.includes(wifi) ? 'default' : 'outline'}
                onPress={() => field.onChange(field.value.includes(wifi) ? field.value.filter((value) => value !== wifi) : [...field.value, wifi])}>
                <Text className="capitalize">{wifi}</Text>
              </Button>
            ))}
          </View>
        </View>
      )} />

      <Controller control={control} name="priceBuckets" render={({ field }) => (
        <View className="gap-2">
          <Text>Preferred price</Text>
          <View className="flex-row gap-2">
            {(['budget', 'moderate', 'premium'] as PriceBucket[]).map((bucket) => (
              <Button key={bucket} className="flex-1" size="sm" variant={field.value.includes(bucket) ? 'default' : 'outline'}
                onPress={() => field.onChange(field.value.includes(bucket) ? field.value.filter((value) => value !== bucket) : [...field.value, bucket])}>
                <Text>{PRICE_BUCKET_LABELS[bucket]}</Text>
              </Button>
            ))}
          </View>
        </View>
      )} />

      <Controller control={control} name="openNowOnly" render={({ field }) => (
        <Button variant={field.value ? 'default' : 'outline'} onPress={() => field.onChange(!field.value)}>
          <Text>Open now only</Text>
        </Button>
      )} />

      <Button loading={isSaving} loadingLabel="Saving…" onPress={handleSubmit(savePreferences)}>
        <Text>Save preferences</Text>
      </Button>
      {saveError && <Text accessibilityRole="alert" className="text-destructive">{saveError}</Text>}
      <Button variant="outline" loading={isSigningOut} loadingLabel="Logging out…" onPress={handleSignOut}>
        <Text>Log out</Text>
      </Button>
    </View>
  );
}
