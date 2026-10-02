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
import { toastFormErrors } from '@/lib/form-errors';
import { emailSchema } from '@/lib/schemas/auth';
import { AuthBody } from '@/components/auth-body';
import { AuthField } from '@/components/auth-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/useToast';

const schema = z.object({ email: emailSchema });
type ResetValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const [sent, setSent] = useState(false);
  const { control, handleSubmit } = useForm<ResetValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  async function submit({ email }: ResetValues) {
    setIsSubmitting(true);
    try {
      await withTimeout(sendPasswordResetEmail(auth, email));
      setSent(true);
      showToast({ type: 'success', message: 'Password reset email sent' });
    } catch (submitError) {
      showToast({ type: 'error', message: getUserFriendlyError(submitError, 'We could not send a reset email. Please try again.') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthBody>
      <View className="gap-4">
        <Text className="text-2xl font-bold">Reset your password</Text>
        <Text className="text-muted-foreground">Enter your account email and we’ll send a secure reset link.</Text>
        {sent ? (
          <View className="gap-4">
            <Text className="rounded-xl bg-success p-3 text-success-foreground">Check your inbox for a password-reset link.</Text>
            <Button onPress={() => router.replace('/(auth)/login')}><Text>Back to Log In</Text></Button>
          </View>
        ) : (
          <>
            <AuthField index={0}>
              <Controller control={control} name="email" render={({ field }) => (
                <Input autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@email.com" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />
              )} />
            </AuthField>
            <Button loading={isSubmitting} loadingLabel="Sending reset email…" onPress={handleSubmit(submit, (errors) => toastFormErrors(errors, showToast))}>
              <Text>Send reset email</Text>
            </Button>
            <Button variant="link" onPress={() => goBack('/(auth)/login')}><Text>Back to Log In</Text></Button>
          </>
        )}
      </View>
    </AuthBody>
  );
}
