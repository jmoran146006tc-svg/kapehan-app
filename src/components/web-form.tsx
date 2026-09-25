import type { ReactNode } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

type WebFormProps = ViewProps & { onSubmit: () => void; children: ReactNode };

export function WebForm({ onSubmit, children, ...props }: WebFormProps) {
  if (Platform.OS !== 'web') return <View {...props}>{children}</View>;
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} style={{ display: 'contents' }}>
      <View {...props}>{children}</View>
    </form>
  );
}
