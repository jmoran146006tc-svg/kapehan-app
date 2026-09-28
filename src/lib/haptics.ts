import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function safely(run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try { void run().catch(() => {}); } catch { /* Haptics must never interrupt navigation. */ }
}

export const tap = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const select = () => safely(() => Haptics.selectionAsync());
export const success = () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warning = () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
