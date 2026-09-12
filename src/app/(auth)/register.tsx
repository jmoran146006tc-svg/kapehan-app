import { View } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type SelectableRole = 'user' | 'owner';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SelectableRole>('user');
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        role,
        preferences: {},
        savedShopIds: [],
      });
      router.replace('/'); // index.tsx picks up the new role and redirects
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <View className="flex-1 justify-center gap-4 p-6 bg-background">
      <Text className="text-2xl font-bold mb-2">Sign up</Text>
      <Input placeholder="Name" value={name} onChangeText={setName} />
      <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

      {/* TODO: swap for RNR RadioGroup once you've added it via the CLI */}
      <View className="flex-row gap-2">
        <Button variant={role === 'user' ? 'default' : 'outline'} onPress={() => setRole('user')} className="flex-1">
          <Text>Customer</Text>
        </Button>
        <Button variant={role === 'owner' ? 'default' : 'outline'} onPress={() => setRole('owner')} className="flex-1">
          <Text>Coffee Shop Owner</Text>
        </Button>
      </View>

      {error && <Text className="text-destructive">{error}</Text>}
      <Button onPress={handleRegister}>
        <Text>Create account</Text>
      </Button>
      <Link href="/(auth)/login" className="text-center text-muted-foreground mt-4">
        <Text>Already have an account? Log in</Text>
      </Link>
    </View>
  );
}
