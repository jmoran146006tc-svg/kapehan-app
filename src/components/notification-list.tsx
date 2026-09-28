import { ScrollView, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Archive, Clock, Coffee, MessageCircle, Star } from 'lucide-react-native';
import type { AppNotification } from '@/types/notification';
import { dayjs } from '@/lib/dayjs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/ui/pressable-scale';
import { enter } from '@/lib/motion';

function notificationMeta(type: AppNotification['type']) {
  if (type === 'listing_archived') return { title: 'Listing archived', icon: Archive };
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

function UnreadDot() {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!reduced) opacity.set(withRepeat(withTiming(0.5, { duration: 1500, reduceMotion: ReduceMotion.System }), -1, true));
  }, [opacity, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className="h-2.5 w-2.5 rounded-full bg-accent" />;
}

export function NotificationList({ notifications, onPress }: NotificationListProps) {
  return (
    <ScrollView className="flex-1 bg-background px-4" contentContainerClassName="gap-3 py-4 pb-8">
      {notifications.map((notification, index) => {
        const meta = notificationMeta(notification.type);
        return (
          <Animated.View key={notification.id} entering={enter(index)}>
          <PressableScale onPress={() => onPress?.(notification)} scaleTo={0.98} haptic="tap" accessibilityLabel={meta.title}>
            <Card className={notification.read ? 'py-4 opacity-75' : 'py-4'}>
              <CardHeader className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <Icon as={meta.icon} size={18} className="text-primary" />
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <CardTitle className="flex-1">{meta.title}</CardTitle>
                    {!notification.read ? <UnreadDot /> : null}
                  </View>
                  <CardDescription>{notification.message}</CardDescription>
                  <Text className="text-xs text-muted-foreground">
                    {notification.createdAt ? dayjs(notification.createdAt.toDate()).fromNow() : 'Just now'}
                  </Text>
                </View>
              </CardHeader>
            </Card>
          </PressableScale>
          </Animated.View>
        );
      })}
      {notifications.length === 0 ? <EmptyState title="All caught up" description="Shop and review updates will appear here." /> : null}
    </ScrollView>
  );
}
