import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { AppNotification } from '@/types/notification';
import { NotificationList } from '@/components/notification-list';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export default function OwnerNotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc')), (snapshot) => setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AppNotification)));
  }, [user]);

  return <View className="flex-1 bg-background"><View className="flex-row items-center gap-2 bg-primary px-4 pb-4 pt-12"><Button size="icon" variant="ghost" onPress={() => router.back()}><Icon as={ArrowLeft} className="text-primary-foreground" /></Button><Text className="text-2xl font-bold text-primary-foreground">Notifications</Text></View><NotificationList notifications={notifications} onPress={(notification) => { if (user && !notification.read) void updateDoc(doc(db, 'users', user.uid, 'notifications', notification.id), { read: true }); if (notification.shopId) router.push({ pathname: '/(owner)/shop/[id]/reviews', params: { id: notification.shopId } } as never); }} /></View>;
}
