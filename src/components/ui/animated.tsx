import type { ComponentProps } from 'react';
import Animated from 'react-native-reanimated';
import { cssInterop } from 'nativewind';

function AnimatedView(props: ComponentProps<typeof Animated.View> & { className?: string }) {
  return <Animated.View {...props} />;
}

function AnimatedScrollView(
  props: ComponentProps<typeof Animated.ScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  },
) {
  return <Animated.ScrollView {...props} />;
}

cssInterop(AnimatedView, { className: 'style' });
cssInterop(AnimatedScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

export { AnimatedScrollView, AnimatedView };
