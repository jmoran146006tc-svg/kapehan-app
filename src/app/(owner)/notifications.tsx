import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { collection, doc, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { dayjs } from '@/lib/dayjs';
import type { AppNotification } from '@/types/notification';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function OwnerNotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc')),
      (snap) => setNotifications(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as AppNotification))
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unread = notifications.filter((notification) => !notification.read);
    if (!unread.length) return;

    const batch = writeBatch(db);
    unread.forEach((notification) => batch.update(doc(db, 'users', user.uid, 'notifications', notification.id), { read: true }));
    void batch.commit();
  }, [notifications, user]);

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-3">
      <Text className="text-2xl font-bold">Notifications</Text>
      {notifications.map((notification) => (
        <Pressable key={notification.id}>
          <Card className={notification.read ? 'opacity-60' : undefined}>
            <CardHeader>
              <View className="flex-row items-start justify-between gap-2">
                <CardTitle className="flex-1">{notification.message}</CardTitle>
                {!notification.read && <Text className="text-xs text-primary">New</Text>}
              </View>
              <CardDescription>
                {notification.createdAt ? dayjs(notification.createdAt.toDate()).fromNow() : 'Just now'}
              </CardDescription>
            </CardHeader>
          </Card>
        </Pressable>
      ))}
      {notifications.length === 0 && <Text className="text-muted-foreground">No notifications yet.</Text>}
    </ScrollView>
  );
}
