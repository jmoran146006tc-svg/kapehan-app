import { ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';

interface AuthShellProps {
  active: 'login' | 'register';
  children: React.ReactNode;
}

export function AuthShell({ active, children }: AuthShellProps) {
  return (
    <View className="flex-1 bg-primary">
      <View className="h-[38%] items-center justify-center gap-2 px-6">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent">
          <Logo width={42} height={42} accessibilityLabel="Kapehan" />
        </View>
        <Text className="font-serif text-4xl font-bold text-primary-foreground">Kapehan</Text>
        <Text className="text-center text-sm text-primary-foreground/75">Discover your perfect cup in Tagum City</Text>
      </View>
      <ScrollView className="min-h-[62%] flex-1 rounded-t-3xl bg-background" contentContainerClassName="gap-5 px-6 py-6" keyboardShouldPersistTaps="handled">
        <View className="flex-row rounded-full bg-secondary p-1">
          <Link href="/(auth)/login" className={active === 'login' ? 'flex-1 rounded-full bg-primary px-3 py-2 text-center' : 'flex-1 rounded-full px-3 py-2 text-center'}>
            <Text className={active === 'login' ? 'text-center font-semibold text-primary-foreground' : 'text-center font-semibold'}>Log In</Text>
          </Link>
          <Link href="/(auth)/register" className={active === 'register' ? 'flex-1 rounded-full bg-primary px-3 py-2 text-center' : 'flex-1 rounded-full px-3 py-2 text-center'}>
            <Text className={active === 'register' ? 'text-center font-semibold text-primary-foreground' : 'text-center font-semibold'}>Register</Text>
          </Link>
        </View>
        {children}
      </ScrollView>
    </View>
  );
}
