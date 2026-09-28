import '@/global.css';
import { Slot } from 'expo-router';
import { PortalHost } from '@rn-primitives/portal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '@/components/connectivity-banner';
import { ToastProvider } from '@/components/ui/toast';
import { colorScheme } from 'nativewind';
import { useFonts } from 'expo-font';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep NativeWind and the native appearance on the same explicit palette.
colorScheme.set('light');
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <>
        <ConnectivityBanner />
        <ToastProvider><Slot /></ToastProvider>
        <PortalHost />
      </>
    </SafeAreaProvider>
  );
}
