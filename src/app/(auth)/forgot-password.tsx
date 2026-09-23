import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import { getUserFriendlyError } from '@/lib/errors';
import { goBack } from '@/lib/navigation';
import { emailSchema } from '@/lib/schemas/auth';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

const schema = z.object({ email: emailSchema });
type ResetValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<ResetValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  async function submit({ email }: ResetValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await withTimeout(sendPasswordResetEmail(auth, email));
      setSent(true);
    } catch (submitError) {
      setError(getUserFriendlyError(submitError, 'We could not send a reset email. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return <View className="flex-1 bg-primary"><AuthShell active="login"><View className="gap-4"><Text className="text-2xl font-bold">Reset your password</Text><Text className="text-muted-foreground">Enter your account email and we’ll send a secure reset link.</Text>{sent ? <View className="gap-4"><Text className="rounded-xl bg-success p-3 text-success-foreground">Check your inbox for a password-reset link.</Text><Button onPress={() => router.replace('/(auth)/login')}><Text>Back to Log In</Text></Button></View> : <><Controller control={control} name="email" render={({ field }) => <Input autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@email.com" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />} />{errors.email ? <Text className="text-destructive">{errors.email.message}</Text> : null}{error ? <Text accessibilityRole="alert" className="text-destructive">{error}</Text> : null}<Button loading={isSubmitting} loadingLabel="Sending reset email…" onPress={handleSubmit(submit)}><Text>Send reset email</Text></Button><Button variant="link" onPress={() => goBack('/(auth)/login')}><Text>Back to Log In</Text></Button></>}</View></AuthShell></View>;
}
