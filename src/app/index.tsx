import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Text } from '@/components/ui/text';

export default function Index() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (role === 'owner') return <Redirect href="/(owner)" />;
  if (role === 'admin') return <Redirect href="/(admin)" />;
  return <Redirect href="/(user)" />;
}
