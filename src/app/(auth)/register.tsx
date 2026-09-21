import { View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, db } from '@/lib/firebase';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';
import { registerSchema, type RegisterValues } from '@/lib/schemas/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AuthShell } from '@/components/auth-shell';

export default function RegisterScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'user' },
  });

  async function handleRegister(values: RegisterValues, role: 'user' | 'owner') {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const cred = await withTimeout(createUserWithEmailAndPassword(auth, values.email, values.password));
      await withTimeout(setDoc(doc(db, 'users', cred.user.uid), {
        name: values.name,
        email: values.email,
        role,
        status: 'active',
        createdAt: serverTimestamp(),
        preferences: {},
        savedShopIds: [],
        recentlyViewed: [],
        visitCount: 0,
      }));
      router.replace('/'); // index.tsx picks up the new role and redirects
    } catch (error) {
      setSubmitError(getUserFriendlyError(error, 'We could not create your account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-primary">
      <AuthShell active="register">
        <View className="gap-4">
        <Text className="text-2xl font-bold">Join Kapehan</Text>
        <Controller control={control} name="name" render={({ field }) => (
          <Input placeholder="Maria Santos" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoComplete="name" />
        )} />
        {errors.name && <Text className="text-destructive">{errors.name.message}</Text>}
        <Controller control={control} name="email" render={({ field }) => (
          <Input placeholder="you@email.com" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
        )} />
        {errors.email && <Text className="text-destructive">{errors.email.message}</Text>}
        <Controller control={control} name="password" render={({ field }) => (
          <Input placeholder="••••••••" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoComplete="new-password" secureTextEntry />
        )} />
        {errors.password && <Text className="text-destructive">{errors.password.message}</Text>}

        {submitError && <Text accessibilityRole="alert" className="text-destructive">{submitError}</Text>}
        <Button loading={isSubmitting} loadingLabel="Creating account…" onPress={handleSubmit((values) => handleRegister(values, 'user'))}>
          <Text>Create Customer Account</Text>
        </Button>
        <Button className="bg-[#B85A20]" loading={isSubmitting} loadingLabel="Creating account…" onPress={handleSubmit((values) => handleRegister(values, 'owner'))}>
          <Text>Create Owner Account</Text>
        </Button>
        </View>
      </AuthShell>
    </SafeAreaView>
  );
}
