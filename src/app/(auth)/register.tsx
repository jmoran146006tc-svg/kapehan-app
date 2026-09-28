import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, db } from '@/lib/firebase';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';
import { toastFormErrors } from '@/lib/form-errors';
import { registerSchema, type RegisterValues } from '@/lib/schemas/auth';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { WebForm } from '@/components/web-form';
import { useToast } from '@/hooks/useToast';

export default function RegisterScreen() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalDocument, setLegalDocument] = useState<'terms' | 'privacy' | null>(null);
  const { control, handleSubmit } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'user', agreedToTerms: false },
  });

  async function handleRegister(values: RegisterValues, role: 'user' | 'owner') {
    setIsSubmitting(true);
    try {
      const cred = await withTimeout(createUserWithEmailAndPassword(auth, values.email, values.password));
      await withTimeout(setDoc(doc(db, 'users', cred.user.uid), {
        name: values.name,
        email: values.email,
        role,
        status: 'active',
        createdAt: serverTimestamp(),
        agreedToTermsAt: serverTimestamp(),
        preferences: {},
        savedShopIds: [],
        recentlyViewed: [],
        visitCount: 0,
      }));
      router.replace('/'); // index.tsx picks up the new role and redirects
    } catch (error) {
      showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not create your account. Please try again.') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-primary">
      <AuthShell active="register">
        <WebForm className="gap-4" onSubmit={handleSubmit((values) => handleRegister(values, 'user'), (errors) => toastFormErrors(errors, showToast))}>
        <Text className="text-2xl font-bold">Join Kapehan</Text>
        <AuthField index={0}><Controller control={control} name="name" render={({ field }) => (
          <Input placeholder="Maria Santos" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoComplete="name" />
        )} /></AuthField>
        <AuthField index={1}><Controller control={control} name="email" render={({ field }) => (
          <Input placeholder="you@email.com" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
        )} /></AuthField>
        <AuthField index={2}><Controller control={control} name="password" render={({ field }) => (
          <Input placeholder="••••••••" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} autoComplete="new-password" secureTextEntry />
        )} /></AuthField>

        <View className="flex-row items-start gap-3">
          <Controller control={control} name="agreedToTerms" render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} accessibilityLabel="I agree to the Terms and Data Privacy Notice" />
          )} />
          <Text className="flex-1 text-sm leading-5">I agree to the{' '}
            <Text className="text-sm font-semibold text-accent underline" onPress={() => setLegalDocument('terms')} accessibilityRole="link">Terms & Conditions</Text>
            {' '}and{' '}
            <Text className="text-sm font-semibold text-accent underline" onPress={() => setLegalDocument('privacy')} accessibilityRole="link">Data Privacy Notice</Text>.
          </Text>
        </View>

        <Button loading={isSubmitting} loadingLabel="Creating account…" onPress={handleSubmit((values) => handleRegister(values, 'user'), (errors) => toastFormErrors(errors, showToast))}>
          <Text>Create Customer Account</Text>
        </Button>
        <Button className="bg-accent" loading={isSubmitting} loadingLabel="Creating account…" onPress={handleSubmit((values) => handleRegister(values, 'owner'), (errors) => toastFormErrors(errors, showToast))}>
          <Text>Create Owner Account</Text>
        </Button>
        </WebForm>
        <Dialog open={legalDocument !== null} onOpenChange={(open) => { if (!open) setLegalDocument(null); }}>
          <DialogContent className="max-h-[85%]">
            <DialogHeader><DialogTitle>{legalDocument === 'terms' ? 'Terms & Conditions' : 'Data Privacy Notice'}</DialogTitle></DialogHeader>
            <ScrollView className="w-full" contentContainerClassName="pb-4">
              <Text>{legalDocument === 'terms'
                ? '[PLACEHOLDER — replace with reviewed Terms & Conditions text]'
                : '[PLACEHOLDER — replace with reviewed Philippine Data Privacy Act notice text]'}</Text>
            </ScrollView>
          </DialogContent>
        </Dialog>
      </AuthShell>
    </SafeAreaView>
  );
}
