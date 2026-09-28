import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import type { ComponentProps } from 'react';

// NativeWind needs this adapter for className on Expo's native gradient view.
function LinearGradient(props: ComponentProps<typeof ExpoLinearGradient> & { className?: string }) {
  return <ExpoLinearGradient {...props} />;
}
cssInterop(LinearGradient, { className: 'style' });

export { LinearGradient };
