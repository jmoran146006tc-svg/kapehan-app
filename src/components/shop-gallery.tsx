import { useState } from 'react';
import { FlatList, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RemoteImage } from '@/components/ui/remote-image';
import { PressableScale } from '@/components/ui/pressable-scale';
import { X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cloudinaryImageUrl } from '@/lib/cloudinary';

export function ShopGallery({ photos, shopName }: { photos: string[]; shopName: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (photos.length < 2) return null;

  return (
    <View className="gap-2">
      <Text className="font-display text-xl">Gallery</Text>
      <FlatList
        horizontal
        data={photos}
        keyExtractor={(photo, position) => `${photo}-${position}`}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pb-1"
        renderItem={({ item, index: position }) => (
          <PressableScale
            accessibilityLabel={`View photo ${position + 1} of ${shopName}`}
            onPress={() => { setStartIndex(position); setIndex(position); setOpen(true); }}
            className="h-24 w-28 overflow-hidden rounded-2xl bg-secondary">
            <RemoteImage source={{ uri: cloudinaryImageUrl(item, 320) }} recyclingKey={`${item}-${position}`} className="h-full w-full" contentFit="cover" transition={220} />
          </PressableScale>
        )}
      />
      <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-primary">
          <View className="absolute left-4 right-4 z-10 flex-row items-center justify-between" style={{ top: insets.top + 12 }}>
            <Text className="font-semibold text-primary-foreground">{index + 1} / {photos.length}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close gallery" onPress={() => setOpen(false)} className="h-11 w-11 items-center justify-center rounded-full bg-card">
              <Icon as={X} size={22} />
            </Pressable>
          </View>
          <FlatList
            key={startIndex}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={startIndex}
            getItemLayout={(_, position) => ({ length: width, offset: width * position, index: position })}
            keyExtractor={(photo, position) => `${photo}-${position}`}
            onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index: position }) => (
              <View style={{ width, height }} className="items-center justify-center">
                <RemoteImage source={{ uri: item }} recyclingKey={`${item}-${position}`} style={{ width, height: height * 0.8 }} contentFit="contain" transition={220} />
              </View>
            )}
          />
          <View pointerEvents="none" className="absolute left-0 right-0 flex-row justify-center gap-2" style={{ bottom: insets.bottom + 24 }}>
            {photos.map((photo, position) => (
              <View key={`${photo}-${position}`} className={position === index ? 'h-2 w-5 rounded-full bg-accent' : 'h-2 w-2 rounded-full bg-card/50'} />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
