import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { verifyFirestoreConnectivity } from '@/lib/connectivity';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export function ConnectivityBanner() {
  const { user } = useAuth();
  const checkedUserId = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      checkedUserId.current = null;
      setError(null);
      return;
    }

    if (checkedUserId.current === user.uid) return;
    checkedUserId.current = user.uid;
    let active = true;

    void verifyFirestoreConnectivity(user.uid)
      .then(() => {
        if (active) setError(null);
      })
      .catch(() => {
        if (active) {
          setError('We could not reach Kapehan’s data service. Check your connection and try again.');
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (!error) return null;

  return (
    <View className="flex-row items-center gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-3">
      <Text accessibilityRole="alert" className="flex-1 text-sm text-destructive">{error}</Text>
      <Button size="sm" variant="outline" onPress={() => setError(null)}>
        <Text>Dismiss</Text>
      </Button>
    </View>
  );
}
