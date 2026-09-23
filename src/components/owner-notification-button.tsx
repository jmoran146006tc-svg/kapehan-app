import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Bell } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function OwnerNotificationButton() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'users', user.uid, 'notifications'), where('read', '==', false)),
      (snap) => setUnreadCount(snap.size)
    );
  }, [user]);

  if (!user) return null;

  return (
    <Button size="icon" variant="ghost" onPress={() => router.push('/(owner)/notifications')}>
      <View className="relative">
        <Icon as={Bell} className="text-primary-foreground" />
        {unreadCount > 0 && (
          <View className="absolute -right-3 -top-3 h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1">
            <Text className="text-[10px] text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>
    </Button>
  );
}
