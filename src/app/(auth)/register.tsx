import { View } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, db } from '@/lib/firebase';
import { getUserFriendlyError } from '@/lib/errors';
import { registerSchema, type RegisterValues } from '@/lib/schemas/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function RegisterScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'user' },
  });

  async function handleRegister(values: RegisterValues) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: values.name,
        email: values.email,
        role: values.role,
        preferences: {},
        savedShopIds: [],
        recentlyViewed: [],
      });
      router.replace('/'); // index.tsx picks up the new role and redirects
    } catch (error) {
      setSubmitError(getUserFriendlyError(error, 'We could not create your account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']}>
      <View className="flex-1 justify-center gap-4 p-6 bg-background">
        <Text className="text-2xl font-bold mb-2">Sign up</Text>
        <Controller control={control} name="name" render={({ field }) => (
          <Input placeholder="Name" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoComplete="name" />
        )} />
        {errors.name && <Text className="text-destructive">{errors.name.message}</Text>}
        <Controller control={control} name="email" render={({ field }) => (
          <Input placeholder="Email" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
        )} />
        {errors.email && <Text className="text-destructive">{errors.email.message}</Text>}
        <Controller control={control} name="password" render={({ field }) => (
          <Input placeholder="Password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoComplete="new-password" secureTextEntry />
        )} />
        {errors.password && <Text className="text-destructive">{errors.password.message}</Text>}

        <Controller control={control} name="role" render={({ field }) => (
          <View className="flex-row gap-2">
            <Button variant={field.value === 'user' ? 'default' : 'outline'} onPress={() => field.onChange('user')} className="flex-1">
              <Text>Customer</Text>
            </Button>
            <Button variant={field.value === 'owner' ? 'default' : 'outline'} onPress={() => field.onChange('owner')} className="flex-1">
              <Text>Coffee Shop Owner</Text>
            </Button>
          </View>
        )} />

        {submitError && <Text accessibilityRole="alert" className="text-destructive">{submitError}</Text>}
        <Button loading={isSubmitting} loadingLabel="Creating account…" onPress={handleSubmit(handleRegister)}>
          <Text>Create account</Text>
        </Button>
        <Link href="/(auth)/login" className="text-center text-muted-foreground mt-4">
          <Text>Already have an account? Log in</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
