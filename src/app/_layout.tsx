// Important: merge this into an existing app layout rather than overwriting it.
// Your current file already has ThemeProvider / font-loading / SplashScreen
// logic from the Expo template — keep all of that. The only two things this
// scaffold actually needs:
//   1. Whatever your navigator renders should become <Slot /> instead of
//      <Stack>, since (auth)/(user)/(owner)/(admin) each own their own
//      navigator now — the root just needs to hand off to whichever group
//      index.tsx redirects into.
//   2. <PortalHost /> as a sibling after it (needed for RNR's Dialog/Select/etc).

import '@/global.css';
import { Slot } from 'expo-router';
import { PortalHost } from '@rn-primitives/portal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '@/components/connectivity-banner';
import { ToastProvider } from '@/components/ui/toast';

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
