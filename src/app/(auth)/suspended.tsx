import { useState } from 'react';
import { View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import { AuthBody } from '@/components/auth-body';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function SuspendedAccountScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  async function leave() {
    setIsSigningOut(true);
    try { await withTimeout(signOut(auth)); } finally { setIsSigningOut(false); }
  }
  return (
    <AuthBody>
      <View className="gap-4">
        <Text className="text-2xl font-bold">Account suspended</Text>
        <Text className="text-muted-foreground">Your Kapehan account is currently suspended. Please contact an administrator if you believe this is a mistake.</Text>
        <Button loading={isSigningOut} loadingLabel="Signing out…" onPress={() => void leave()}><Text>Log Out</Text></Button>
      </View>
    </AuthBody>
  );
}
