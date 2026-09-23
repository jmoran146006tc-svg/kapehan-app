import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { router } from 'expo-router';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function UserNotificationButton() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'users', user.uid, 'notifications'), where('read', '==', false)),
      (snapshot) => setCount(snapshot.size),
    );
  }, [user]);

  return (
    <View className="relative">
      <Button size="icon" variant="ghost" onPress={() => router.push('/(user)/notifications' as never)}>
        <Icon as={Bell} size={21} className="text-primary-foreground" />
      </Button>
      {count > 0 ? (
        <View className="absolute -right-0.5 -top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1">
          <Text className="text-[10px] font-bold text-white">{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </View>
  );
}
