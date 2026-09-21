import { View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth } from '@/lib/firebase';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';
import { loginSchema, type LoginValues } from '@/lib/schemas/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AuthShell } from '@/components/auth-shell';

export default function LoginScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function handleLogin(values: LoginValues) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await withTimeout(signInWithEmailAndPassword(auth, values.email, values.password));
      router.replace('/'); // index.tsx re-checks role and redirects
    } catch (error) {
      setSubmitError(getUserFriendlyError(error, 'We could not log you in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-primary">
      <AuthShell active="login">
        <View className="gap-4">
        <Text className="text-2xl font-bold">Welcome back</Text>
        <Controller control={control} name="email" render={({ field }) => (
          <Input placeholder="you@email.com" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
        )} />
        {errors.email && <Text className="text-destructive">{errors.email.message}</Text>}
        <Controller control={control} name="password" render={({ field }) => (
          <Input placeholder="••••••••" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoComplete="current-password" secureTextEntry />
        )} />
        {errors.password && <Text className="text-destructive">{errors.password.message}</Text>}
        {submitError && <Text accessibilityRole="alert" className="text-destructive">{submitError}</Text>}
        <Button loading={isSubmitting} loadingLabel="Logging in…" onPress={handleSubmit(handleLogin)}>
          <Text>Log In</Text>
        </Button>
        <Button variant="link" onPress={() => router.push('/(auth)/forgot-password' as never)}><Text>Forgot password?</Text></Button>
        </View>
      </AuthShell>
    </SafeAreaView>
  );
}
