import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { ScreenHeader } from '@/components/screen-header';
import type { AppNotification } from '@/types/notification';
import { NotificationList } from '@/components/notification-list';

export default function UserNotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc')), (snapshot) => setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AppNotification)));
  }, [user]);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Notifications" fallbackHref="/(user)" />
      <NotificationList notifications={notifications} onPress={(notification) => {
        if (user && !notification.read) void updateDoc(doc(db, 'users', user.uid, 'notifications', notification.id), { read: true });
        if (notification.shopId) router.push({ pathname: '/(user)/shop/[id]', params: { id: notification.shopId } });
      }} />
    </View>
  );
}
