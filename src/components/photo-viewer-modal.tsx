import { useState } from 'react';
import { FlatList, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { RemoteImage } from '@/components/ui/remote-image';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { blurActiveElement } from '@/lib/navigation';

interface PhotoViewerProps {
  photos: string[];
  visible: boolean;
  startIndex: number;
  onClose: () => void;
}

export function PhotoViewerModal(props: PhotoViewerProps) {
  if (!props.visible || !props.photos.length) return null;
  return <PhotoViewerContent key={props.startIndex} {...props} />;
}

function PhotoViewerContent({ photos, visible, startIndex, onClose }: PhotoViewerProps) {
  const initialIndex = Math.max(0, Math.min(startIndex, photos.length - 1));
  const [index, setIndex] = useState(initialIndex);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  function close() { blurActiveElement(); onClose(); }

  return (
    <Modal visible={visible} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={close}>
      <View className="flex-1 bg-primary">
        <View className="absolute left-4 right-4 z-10 flex-row items-center justify-between" style={{ top: insets.top + 12 }}>
          <Text className="font-semibold text-primary-foreground">{index + 1} / {photos.length}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close gallery" onPress={close} className="h-11 w-11 items-center justify-center rounded-full bg-card"><Icon as={X} size={22} /></Pressable>
        </View>
        <FlatList
          key={startIndex}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, position) => ({ length: width, offset: width * position, index: position })}
          keyExtractor={(photo, position) => `${photo}-${position}`}
          onMomentumScrollEnd={(event) => setIndex(Math.max(0, Math.min(photos.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))))}
          renderItem={({ item, index: position }) => (
            <View style={{ width, height }} className="items-center justify-center">
              <RemoteImage source={{ uri: item }} recyclingKey={`${item}-${position}`} style={{ width, height: height * 0.8 }} contentFit="contain" transition={reducedMotion ? 0 : 220} />
            </View>
          )}
        />
        <View pointerEvents="none" className="absolute left-0 right-0 flex-row justify-center gap-2" style={{ bottom: insets.bottom + 24 }}>
          {photos.map((photo, position) => <View key={`${photo}-${position}`} className={position === index ? 'h-2 w-5 rounded-full bg-accent' : 'h-2 w-2 rounded-full bg-card/50'} />)}
        </View>
      </View>
    </Modal>
  );
}
