import { Pressable, ScrollView, View } from 'react-native';
import { Clock, Coffee, MessageCircle, Star } from 'lucide-react-native';
import type { AppNotification } from '@/types/notification';
import { dayjs } from '@/lib/dayjs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function notificationMeta(type: AppNotification['type']) {
  if (type === 'shop_hours_updated') return { title: 'Hours updated', icon: Clock };
  if (type === 'shop_menu_updated') return { title: 'Menu updated', icon: Coffee };
  if (type === 'review_received') return { title: 'New review', icon: Star };
  if (type === 'review_reply') return { title: 'Owner replied', icon: MessageCircle };
  return { title: 'Listing update', icon: Coffee };
}

interface NotificationListProps {
  notifications: AppNotification[];
  onPress?: (notification: AppNotification) => void;
}

export function NotificationList({ notifications, onPress }: NotificationListProps) {
  return (
    <ScrollView className="flex-1 bg-background px-4" contentContainerClassName="gap-3 py-4 pb-8">
      {notifications.map((notification) => {
        const meta = notificationMeta(notification.type);
        return (
          <Pressable key={notification.id} onPress={() => onPress?.(notification)}>
            <Card className={notification.read ? 'py-4 opacity-75' : 'py-4'}>
              <CardHeader className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <Icon as={meta.icon} size={18} className="text-primary" />
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <CardTitle className="flex-1">{meta.title}</CardTitle>
                    {!notification.read ? <View className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
                  </View>
                  <CardDescription>{notification.message}</CardDescription>
                  <Text className="text-xs text-muted-foreground">
                    {notification.createdAt ? dayjs(notification.createdAt.toDate()).fromNow() : 'Just now'}
                  </Text>
                </View>
              </CardHeader>
            </Card>
          </Pressable>
        );
      })}
      {notifications.length === 0 ? <View className="items-center gap-2 py-10"><Icon as={Coffee} size={28} className="text-accent" /><Text className="text-center font-semibold">All caught up</Text><Text className="text-center text-sm text-muted-foreground">Shop and review updates will appear here.</Text></View> : null}
    </ScrollView>
  );
}
