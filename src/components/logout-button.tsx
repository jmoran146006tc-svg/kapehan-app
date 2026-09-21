import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type LogoutButtonProps = Pick<ButtonProps, 'className' | 'size' | 'variant'>;

export function LogoutButton({ className, size, variant = 'outline' }: LogoutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await withTimeout(signOut(auth));
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Could not log out', getUserFriendlyError(error, 'Please try again.'));
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Button className={className} size={size} variant={variant} loading={isSigningOut} loadingLabel="Logging out…" onPress={handleSignOut}>
      <Text className={variant === 'ghost' ? 'text-primary-foreground' : undefined}>Log Out</Text>
    </Button>
  );
}
