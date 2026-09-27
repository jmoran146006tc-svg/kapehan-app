import { useState } from 'react';
import { FlatList, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cloudinaryImageUrl } from '@/lib/cloudinary';

export function ShopGallery({ photos, shopName }: { photos: string[]; shopName: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  if (photos.length < 2) return null;

  return <View className="gap-2">
    <Text className="text-xl font-bold">Gallery</Text>
    <FlatList horizontal data={photos} keyExtractor={(photo, position) => `${photo}-${position}`} showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1" renderItem={({ item, index: position }) => <Pressable accessibilityRole="button" accessibilityLabel={`View photo ${position + 1} of ${shopName}`} onPress={() => { setStartIndex(position); setIndex(position); setOpen(true); }} className="h-24 w-28 overflow-hidden rounded-xl bg-secondary"><Image source={{ uri: cloudinaryImageUrl(item, 320) }} className="h-full w-full" contentFit="cover" transition={220} /></Pressable>} />
    <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <View className="flex-1 bg-primary">
        <View className="absolute left-4 right-4 top-12 z-10 flex-row items-center justify-between"><Text className="font-semibold text-primary-foreground">{index + 1} / {photos.length}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close gallery" onPress={() => setOpen(false)} className="rounded-full bg-card p-2"><Icon as={X} size={22} /></Pressable></View>
        <FlatList key={startIndex} data={photos} horizontal pagingEnabled showsHorizontalScrollIndicator={false} initialScrollIndex={startIndex} getItemLayout={(_, position) => ({ length: width, offset: width * position, index: position })} keyExtractor={(photo, position) => `${photo}-${position}`} onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))} renderItem={({ item }) => <View style={{ width, height }} className="items-center justify-center"><Image source={{ uri: item }} style={{ width, height: height * 0.8 }} contentFit="contain" transition={220} /></View>} />
      </View>
    </Modal>
  </View>;
}
