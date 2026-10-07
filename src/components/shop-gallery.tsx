import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { PhotoViewerModal } from '@/components/photo-viewer-modal';
import { blurActiveElement } from '@/lib/navigation';
import { RemoteImage } from '@/components/ui/remote-image';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { cloudinaryImageUrl } from '@/lib/cloudinary';

export function ShopGallery({ photos, shopName }: { photos: string[]; shopName: string }) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
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
            onPress={() => { blurActiveElement(); setStartIndex(position); setOpen(true); }}
            className="h-24 w-28 overflow-hidden rounded-2xl bg-secondary">
            <RemoteImage source={{ uri: cloudinaryImageUrl(item, 320) }} recyclingKey={`${item}-${position}`} className="h-full w-full" contentFit="cover" transition={220} />
          </PressableScale>
        )}
      />
      <PhotoViewerModal photos={photos} visible={open} startIndex={startIndex} onClose={() => setOpen(false)} />
    </View>
  );
}
