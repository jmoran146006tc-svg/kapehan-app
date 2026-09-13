import { View } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

// TODO: swap raw useState for react-hook-form + zod once the fields grow

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/'); // index.tsx re-checks role and redirects
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <SafeAreaView edges={['bottom']}>
      <View className="flex-1 justify-center gap-4 p-6 bg-background">
        <Text className="text-2xl font-bold mb-2">Log in</Text>
        <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {error && <Text className="text-destructive">{error}</Text>}
        <Button onPress={handleLogin}>
          <Text>Log in</Text>
        </Button>
        <Link href="/(auth)/register" className="text-center text-muted-foreground mt-4">
          <Text>Don't have an account? Sign up</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
