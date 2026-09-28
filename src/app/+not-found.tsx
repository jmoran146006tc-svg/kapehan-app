import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { PALETTE } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <LinearGradient colors={[PALETTE.primary, PALETTE.espresso2]} className="flex-1 items-center justify-center gap-4 p-6">
      <Text className="font-display text-3xl text-primary-foreground">Page not found</Text>
      <Text className="text-center text-primary-foreground/75">That Kapehan page does not exist or may have moved.</Text>
      <Button variant="secondary" onPress={() => router.replace('/')}><Text>Go home</Text></Button>
    </LinearGradient>
  );
}
