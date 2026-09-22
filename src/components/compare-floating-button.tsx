import { router, usePathname } from 'expo-router';
import { useCompareStore } from '@/store/compareStore';
import { BottomTabInset } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export function CompareFloatingButton() {
  const ids = useCompareStore((state) => state.ids);
  const pathname = usePathname();

  if (ids.length < 2 || pathname === '/compare' || pathname.endsWith('/compare')) return null;

  return (
    <Button className="absolute right-4 shadow-lg" style={{ bottom: BottomTabInset + 16 }} onPress={() => router.push('/(user)/compare')}>
      <Text>Compare ({ids.length})</Text>
    </Button>
  );
}
