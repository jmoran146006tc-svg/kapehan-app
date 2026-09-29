import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';

const PX_PER_SECOND = 40;
const PAUSE_MS = 1500;

/**
 * Single-line text that ping-pongs horizontally when it is wider than its
 * container. Short text stays still. Reduced motion falls back to an ellipsis.
 */
export function MarqueeText({ children, className }: { children: string; className?: string }) {
  const reduced = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const offset = useSharedValue(0);
  const distance = Math.max(0, textWidth - containerWidth);

  useEffect(() => {
    cancelAnimation(offset);
    offset.set(0);
    if (reduced || distance <= 0) return;
    const duration = (distance / PX_PER_SECOND) * 1000;
    offset.set(
      withRepeat(
        withSequence(
          withDelay(PAUSE_MS, withTiming(-distance, { duration, easing: Easing.linear })),
          withDelay(PAUSE_MS, withTiming(0, { duration, easing: Easing.linear })),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(offset);
  }, [distance, offset, reduced, children]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  if (reduced) {
    return <Text numberOfLines={1} className={className}>{children}</Text>;
  }

  return (
    <View
      className="min-w-0 overflow-hidden"
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      {/* The wide row lets the text lay out at its natural width so we can measure it. */}
      <Animated.View style={[{ flexDirection: 'row', width: 10000 }, style]}>
        <Text
          numberOfLines={1}
          className={className}
          onLayout={(event) => setTextWidth(event.nativeEvent.layout.width)}>
          {children}
        </Text>
      </Animated.View>
    </View>
  );
}