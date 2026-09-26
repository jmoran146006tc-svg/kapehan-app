import '@/global.css';
import { Slot } from 'expo-router';
import { PortalHost } from '@rn-primitives/portal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '@/components/connectivity-banner';
import { ToastProvider } from '@/components/ui/toast';
import { colorScheme } from 'nativewind';

// Keep NativeWind and the native appearance on the same explicit palette.
colorScheme.set('light');

export default function RootLayout() {
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
